const express = require('express')
const router = express.Router()

const contractsController = require('../controllers/contracts')
const jobsController = require('../controllers/jobs')
const profilesController = require('../controllers/profiles')
const adminController = require('../controllers/admin')
const { getProfile } = require('../middleware/getProfile')

router.get('/contracts/:id', getProfile, contractsController.getContract)
router.get('/contracts', getProfile, contractsController.getContracts)
router.get('/jobs/unpaid', getProfile, jobsController.getUnpaidJobs)
router.post('/jobs/:id/pay', getProfile, jobsController.payJob)
router.post('/balances/deposit/:userId', getProfile, profilesController.deposit)
router.get('/admin/best-profession', adminController.getBestProfession)
router.get('/admin/best-clients', adminController.getBestClients)

module.exports = router
