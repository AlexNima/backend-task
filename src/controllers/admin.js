const { Op } = require('sequelize')
const { sequelize } = require('../model')

const getBestProfession = async (req, res) => {
  const { Profile, Contract, Job } = req.app.get('models')
  const start = req.query.start
  const end = req.query.end
  if (!start || !end)
    return res.status(400).send('start and end queries are required').end()

  const bestPaid = await Job.findAll({
    attributes: [
      'id',
      [sequelize.fn('sum', sequelize.col('price')), 'total_amount']
    ],
    where: {
      paid: true,
      paymentDate: {
        [Op.lte]: end,
        [Op.gte]: start
      }
    },
    include: [
      {
        model: Contract,
        include: { model: Profile, as: 'Contractor' }
      }
    ],
    group: ['Contract->Contractor.profession'],
    order: [['total_amount', 'DESC']],
    limit: 1
  })
  if (!bestPaid.length) return res.status(404).end()
  res.json(bestPaid[0].Contract.Contractor.profession)
}

const getBestClients = async (req, res) => {
  const { Profile, Contract, Job } = req.app.get('models')
  const start = req.query.start
  const end = req.query.end
  let limit = 2
  if (req.query.limit) limit = req.query.limit
  if (!start || !end)
    return res.status(400).send('start and end queries are required').end()

  const bestPaid = await Job.findAll({
    attributes: ['id', [sequelize.fn('sum', sequelize.col('price')), 'paid']],
    where: {
      paid: true,
      paymentDate: {
        [Op.lte]: end,
        [Op.gte]: start
      }
    },
    include: [
      {
        model: Contract,
        include: { model: Profile, as: 'Client' }
      }
    ],
    group: ['Contract->Client.id'],
    order: [['paid', 'DESC']],
    limit: limit
  })
  if (!bestPaid.length) return res.status(404).end()

  let result = []
  for (let i = 0; i < bestPaid.length; i++) {
    result[i] = {
      id: bestPaid[i].Contract.Client.id,
      fullName:
        bestPaid[i].Contract.Client.firstName +
        ' ' +
        bestPaid[i].Contract.Client.lastName,
      paid: bestPaid[i].paid
    }
  }
  res.json(result)
}

module.exports = {
  getBestProfession,
  getBestClients
}
