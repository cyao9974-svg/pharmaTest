import { Router } from 'express';
import { PharmacyController } from '../controllers/pharmacyController.js';

const router = Router();

// Searches & Scraping
router.post('/search', PharmacyController.search);
router.get('/searches', PharmacyController.getSearches);

// Pharmacies CRUD
router.get('/pharmacies', PharmacyController.getPharmacies);
router.get('/pharmacies/:id', PharmacyController.getPharmacyById);
router.put('/pharmacies/:id', PharmacyController.updatePharmacy);
router.delete('/pharmacies/:id', PharmacyController.deletePharmacy);

// Stats & Demo
router.get('/stats', PharmacyController.getStats);
router.post('/demo/seed', PharmacyController.seedDemo);

// Exports
router.get('/export/pdf', PharmacyController.exportPdf);
router.get('/export/csv', PharmacyController.exportCsv);
router.get('/export/json', PharmacyController.exportJson);

export default router;
