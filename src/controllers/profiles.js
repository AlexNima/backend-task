const { sequelize } = require('../model')
const Mutex = require('async-mutex').Mutex
const mutex = new Mutex()

const deposit = async (req, res) => {
  const { Contract, Job, Profile } = req.app.get('models')
  const { userId } = req.params
  let transaction
  const release = await mutex.acquire()

  try {
    if (userId != req.profile.id)
      return res
        .status(401)
        .send('Cannot deposit balance to a contractor')
        .end()
    if (req.profile.type != 'client')
      return res.status(401).send('You are not a client').end()
    if (!req.body.amount)
      return res.status(400).send('Amount is required').end()

    transaction = await sequelize.transaction()
    const unpaidJobs = await Job.findAll(
      {
        where: { paid: null },
        include: {
          model: Contract,
          where: {
            status: 'in_progress',
            ClientId: req.profile.id
          },
          required: true
        }
      },
      { transaction }
    )
    if (!unpaidJobs.length)
      return res.status(404).send('You do not have any jobs to pay').end()

    const unpaidJobsLength = unpaidJobs.length
    var unpaidJobsTotalAmount = 0

    for (let i = 0; i < unpaidJobsLength; i++) {
      unpaidJobsTotalAmount += Number(unpaidJobs[i].price)
    }

    const allowedAmount =
      (await calculatePercentage(unpaidJobsTotalAmount, 25)) +
      unpaidJobsTotalAmount
    if (!(req.body.amount <= allowedAmount)) {
      return res
        .status(400)
        .send('Cannot deposit more than 25% the total of jobs you have to pay')
        .end()
    }

    const makeDeposit = await Profile.increment(
      { balance: req.body.amount },
      { where: { id: userId } },
      { transaction }
    )

    if (!makeDeposit)
      return res.status(400).send('Deposit could not be made').end()
    await transaction.commit()
    res.json('Successfully deposited into your account')
  } catch {
    await transaction.rollback()
    return res.status(400).send('Balance could not be updated').end()
  } finally {
    release()
  }
}

const calculatePercentage = async (value, percentage) => {
  return (value / 100) * percentage
}

module.exports = {
  deposit
}
