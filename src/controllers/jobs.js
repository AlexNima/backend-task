const { Op } = require('sequelize')
const { sequelize } = require('../model')
const Mutex = require('async-mutex').Mutex
const mutex = new Mutex()

const getUnpaidJobs = async (req, res) => {
  const { Contract, Job } = req.app.get('models')
  const unpaidJobs = await Job.findAll({
    where: { paid: null },
    include: {
      model: Contract,
      where: {
        status: 'in_progress',
        [Op.or]: [
          { ContractorId: req.profile.id },
          { ClientId: req.profile.id }
        ]
      },
      required: true
    }
  })
  if (!unpaidJobs.length) return res.status(404).end()
  res.json(unpaidJobs)
}

const payJob = async (req, res) => {
  const { Job, Profile, Contract } = req.app.get('models')
  const { id } = req.params

  let transaction
  const release = await mutex.acquire()
  try {
    transaction = await sequelize.transaction()
    const unpaidJob = await Job.findOne(
      {
        where: {
          id,
          paid: null
        },
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
    if (!unpaidJob) return res.status(404).send('Unpaid job not found').end()

    if (!(req.profile.balance >= unpaidJob.price)) {
      return res
        .status(400)
        .send('You do not have enough balance to pay for this job')
        .end()
    }
    const paidJob = await Job.update(
      { paid: true, paymentDate: new Date() },
      {
        where: { id }
      },
      { transaction }
    )
    if (!paidJob) return res.status(400).end()

    const client = await Profile.decrement(
      { balance: unpaidJob.price },
      { where: { id: unpaidJob.Contract.ClientId } },
      { transaction }
    )
    if (!client) return res.status(400).end()

    const contractor = await Profile.increment(
      { balance: unpaidJob.price },
      { where: { id: unpaidJob.Contract.ContractorId } },
      { transaction }
    )
    if (!contractor) return res.status(400).end()
    await transaction.commit()
    res.json('Job paid successfully')
  } catch {
    await transaction.rollback()
  } finally {
    release()
  }
}

module.exports = {
  getUnpaidJobs,
  payJob
}
