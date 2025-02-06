import express from 'express';
import {ReportsController} from '../controllers/reportsController.js';

const router = express.Router();

router.post('/generalReports', ReportsController.getGeneralBriefReport);
router.post('/generalViewAllReports', ReportsController.getGeneralViewAllReport);
router.post('/comprehensiveReports', ReportsController.getDetailedReport);

export default router;
