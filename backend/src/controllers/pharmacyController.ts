import { Request, Response } from 'express';
import { db } from '../database/db.js';
import { searchService } from '../services/searchService.js';
import { PdfService } from '../pdf/pdfService.js';
import { normalizePhone, normalizeEmail, normalizeAddress, validateCoordinates } from '../utils/normalizer.js';

export class PharmacyController {
  /**
   * POST /api/search
   */
  public static async search(req: Request, res: Response): Promise<void> {
    try {
      const { city, country, term, forceRefresh, mode } = req.body;
      const result = await searchService.executeSearch({
        city: typeof city === 'string' ? city.trim() : undefined,
        country: typeof country === 'string' ? country.trim() : undefined,
        term: typeof term === 'string' ? term.trim() : undefined,
        forceRefresh: Boolean(forceRefresh),
        mode: mode === 'demo' ? 'demo' : 'real',
      });

      res.status(200).json({
        success: true,
        pharmacies: result.pharmacies,
        searchRecord: result.record,
        fromCache: result.fromCache,
      });
    } catch (err) {
      console.error('[PharmacyController] search error:', err);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la recherche et collecte des pharmacies',
        details: (err as Error).message,
      });
    }
  }

  /**
   * GET /api/pharmacies
   */
  public static async getPharmacies(req: Request, res: Response): Promise<void> {
    try {
      const {
        search,
        verification_status,
        has_location,
        has_phone,
        has_email,
        garde_status,
        source,
      } = req.query;

      const filters = {
        search: typeof search === 'string' ? search : undefined,
        verification_status: typeof verification_status === 'string' ? verification_status : undefined,
        garde_status: typeof garde_status === 'string' ? garde_status : undefined,
        source: typeof source === 'string' ? source : undefined,
        has_location: has_location !== undefined ? has_location === 'true' : undefined,
        has_phone: has_phone !== undefined ? has_phone === 'true' : undefined,
        has_email: has_email !== undefined ? has_email === 'true' : undefined,
      };

      const pharmacies = await db.getPharmacies(filters);
      res.status(200).json({ success: true, count: pharmacies.length, pharmacies });
    } catch (err) {
      console.error('[PharmacyController] getPharmacies error:', err);
      res.status(500).json({ success: false, error: 'Impossible de récupérer les pharmacies' });
    }
  }

  /**
   * GET /api/pharmacies/:id
   */
  public static async getPharmacyById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const pharmacy = await db.getPharmacyById(id);
      if (!pharmacy) {
        res.status(404).json({ success: false, error: 'Pharmacie introuvable' });
        return;
      }
      res.status(200).json({ success: true, pharmacy });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' });
    }
  }

  /**
   * PUT /api/pharmacies/:id
   */
  public static async updatePharmacy(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        name,
        phone,
        secondary_phone,
        email,
        address,
        latitude,
        longitude,
        verification_status,
        garde_status,
        garde_start,
        garde_end,
        notes,
      } = req.body;

      const phoneNorm = normalizePhone(phone);
      const secondaryNorm = normalizePhone(secondary_phone);
      const emailNorm = normalizeEmail(email);
      const addrNorm = normalizeAddress(address);
      const coords = validateCoordinates(latitude, longitude);

      const updated = await db.updatePharmacy(id, {
        ...(name ? { name: name.trim() } : {}),
        phone: phoneNorm.primary || (phone === '' ? null : undefined),
        secondary_phone: secondaryNorm.primary || (secondary_phone === '' ? null : undefined),
        email: emailNorm || (email === '' ? null : undefined),
        address: addrNorm || (address === '' ? null : undefined),
        latitude: coords.latitude,
        longitude: coords.longitude,
        ...(verification_status ? { verification_status } : {}),
        ...(garde_status ? { garde_status } : {}),
        garde_start: garde_start || null,
        garde_end: garde_end || null,
        notes: notes !== undefined ? notes : undefined,
      });

      if (!updated) {
        res.status(404).json({ success: false, error: 'Pharmacie introuvable' });
        return;
      }

      res.status(200).json({ success: true, pharmacy: updated });
    } catch (err) {
      console.error('[PharmacyController] updatePharmacy error:', err);
      res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour' });
    }
  }

  /**
   * DELETE /api/pharmacies/:id
   */
  public static async deletePharmacy(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await db.deletePharmacy(id);
      if (!deleted) {
        res.status(404).json({ success: false, error: 'Pharmacie non trouvée ou déjà supprimée' });
        return;
      }
      res.status(200).json({ success: true, message: 'Pharmacie supprimée avec succès' });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erreur lors de la suppression' });
    }
  }

  /**
   * GET /api/searches
   */
  public static async getSearches(req: Request, res: Response): Promise<void> {
    try {
      const searches = await db.getSearches();
      res.status(200).json({ success: true, searches });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Impossible de récupérer l\'historique des recherches' });
    }
  }

  /**
   * GET /api/stats
   */
  public static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await db.getStats();
      res.status(200).json({ success: true, stats });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erreur lors du calcul des statistiques' });
    }
  }

  /**
   * POST /api/demo/seed
   */
  public static async seedDemo(req: Request, res: Response): Promise<void> {
    try {
      const result = await searchService.executeSearch({
        city: 'Bingerville',
        country: "Côte d'Ivoire",
        term: 'pharmacies de garde Bingerville',
        mode: 'demo',
        forceRefresh: true,
      });
      res.status(200).json({
        success: true,
        message: 'Mode démo activé avec succès (10 pharmacies fictives chargées)',
        pharmacies: result.pharmacies,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erreur lors de l\'activation du mode démo' });
    }
  }

  /**
   * GET /api/export/pdf
   */
  public static async exportPdf(req: Request, res: Response): Promise<void> {
    try {
      const mode = (req.query.type as string) === 'detailed' ? 'detailed' : 'summary';
      const pharmacies = await db.getPharmacies();
      const stats = await db.getStats();

      let pdfBuffer: Buffer;
      let filename: string;

      if (mode === 'detailed') {
        pdfBuffer = await PdfService.generateDetailedPdf(pharmacies, stats);
        filename = `pharmaguard-bingerville-detaille-${new Date().toISOString().slice(0, 10)}.pdf`;
      } else {
        pdfBuffer = await PdfService.generateSummaryPdf(pharmacies, stats);
        filename = `pharmaguard-bingerville-resume-${new Date().toISOString().slice(0, 10)}.pdf`;
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.status(200).send(pdfBuffer);
    } catch (err) {
      console.error('[PharmacyController] exportPdf error:', err);
      res.status(500).json({ success: false, error: 'Erreur lors de la génération du document PDF' });
    }
  }

  /**
   * GET /api/export/csv
   */
  public static async exportCsv(req: Request, res: Response): Promise<void> {
    try {
      const pharmacies = await db.getPharmacies();
      const headers = ['Nom', 'Statut Garde', 'Debut Garde', 'Fin Garde', 'Telephone', 'Telephone Secondaire', 'Email', 'Adresse', 'Ville', 'Pays', 'Latitude', 'Longitude', 'Statut Verification', 'Sources', 'Notes'];
      
      const rows = pharmacies.map(p => {
        const sources = p.sources?.map(s => s.source_name).join(' | ') || '';
        return [
          `"${(p.name || '').replace(/"/g, '""')}"`,
          `"${p.garde_status || 'non_confirme'}"`,
          `"${p.garde_start || ''}"`,
          `"${p.garde_end || ''}"`,
          `"${p.phone || 'Non disponible'}"`,
          `"${p.secondary_phone || ''}"`,
          `"${p.email || 'Non disponible'}"`,
          `"${(p.address || 'Non disponible').replace(/"/g, '""')}"`,
          `"${p.city || 'Bingerville'}"`,
          `"${p.country || "Côte d'Ivoire"}"`,
          p.latitude != null ? p.latitude : '',
          p.longitude != null ? p.longitude : '',
          `"${p.verification_status}"`,
          `"${sources.replace(/"/g, '""')}"`,
          `"${(p.notes || '').replace(/"/g, '""')}"`,
        ].join(';');
      });

      const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
      const filename = `pharmaguard-bingerville-${new Date().toISOString().slice(0, 10)}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csvContent);
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erreur lors de l\'export CSV' });
    }
  }

  /**
   * GET /api/export/json
   */
  public static async exportJson(req: Request, res: Response): Promise<void> {
    try {
      const pharmacies = await db.getPharmacies();
      const stats = await db.getStats();
      const payload = {
        title: 'PharmaGuard Bingerville — Export des données',
        generatedAt: new Date().toISOString(),
        location: {
          city: 'Bingerville',
          country: "Côte d'Ivoire",
        },
        statistics: stats,
        count: pharmacies.length,
        pharmacies,
      };

      const filename = `pharmaguard-bingerville-${new Date().toISOString().slice(0, 10)}.json`;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(JSON.stringify(payload, null, 2));
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erreur lors de l\'export JSON' });
    }
  }
}
