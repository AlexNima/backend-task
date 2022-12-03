const { Op } = require('sequelize')

const getContract = async (req, res) => {
  const { Contract } = req.app.get('models')
  const { id } = req.params
  const contract = await Contract.findOne({
    where: {
      id,
      [Op.or]: [{ ContractorId: req.profile.id }, { ClientId: req.profile.id }]
    }
  })
  if (!contract) return res.status(404).end()
  /* Could be done either way: searching only with the ContractorId or ClientID or comparing the result with the req.profile.id. The first option being faster */
  //const authorization = contract.ClientId == req.profile.id || contract.ContractorId == req.profile.id
  //if(!authorization) return res.status(401).end()
  res.json(contract)
}

const getContracts = async (req, res) => {
  const { Contract } = req.app.get('models')
  const contracts = await Contract.findAll({
    where: {
      status: {
        [Op.not]: 'terminated'
      },
      [Op.or]: [{ ContractorId: req.profile.id }, { ClientId: req.profile.id }]
    }
  })
  if (!contracts.length) return res.status(404).end()
  res.json(contracts)
}

module.exports = {
  getContract,
  getContracts
}
