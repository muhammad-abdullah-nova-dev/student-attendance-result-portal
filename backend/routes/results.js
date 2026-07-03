const express = require('express');
const router = express.Router();
const {
    getStudentResults,
    createResult,
    uploadAssessments,
    getPerformanceAnalysis
} = require('../controllers/resultController');
const { protect, authorize } = require('../middleware/auth');

router.get('/student/:id', protect, getStudentResults);
router.post('/', protect, authorize('teacher', 'admin'), createResult);
router.post('/assessments', protect, authorize('teacher', 'admin'), uploadAssessments);
router.get('/performance-analysis', protect, authorize('admin'), getPerformanceAnalysis);

module.exports = router;
