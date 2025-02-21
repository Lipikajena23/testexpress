import express from 'express';
import { hrController  } from '../controllers/hrController.js';


const router = express.Router();

router.post('/create-user', hrController.createhrUser);
router.get('/get-hruser/:business_entity_id', hrController.getUsersByBusinessEntity);
router.post('/create-mapping', hrController.createMapping);
router.post('/upsert-hr-configuration', hrController.upsertHrConfiguration);

router.get('/:business_entity_id', hrController.getHrConfiguration);
router.post('/create-employee', hrController.createEmployee);
router.get('/fetch-employee/:business_entity_id', hrController.getAllEmployeesByBusinessEntityId);
router.put("/employees/:id", hrController.updateEmployee);
router.put("/employees/deactivate/:global_id", hrController.deactivateUser);

router.post('/attendance', hrController.markAttendance);
router.post('/attendance/markleave', hrController.markEmployeeAttendance);
router.get('/attendance/:business_entity_id', hrController.getAttendance);

router.post('/advance-payment', hrController.createAdvancePayment);
router.get('/advance-payment/:business_entity_id', hrController.getAdvancePayments);
router.get('/due-amount/:employee_id/:business_entity_id', hrController.getDueAmount);
router.post('/payment_transaction', hrController.createPaymentTransaction);
router.get('/employees/due-amount/:business_entity_id', hrController.getEmployeesDueAmount);
router.get('/payment-transactions/:business_entity_id', hrController.getPaymentTransactions);
router.get('/getTodayAttendanceSummary/:business_entity_id', hrController.getTodayAttendanceSummary);




export default router;