import PDFDocument from 'pdfkit';
import { Pharmacy, DashboardStats } from '../types/index.js';

export class PdfService {
  /**
   * Generates a Compact Summary PDF document stream/buffer.
   */
  public static async generateSummaryPdf(pharmacies: Pharmacy[], stats: DashboardStats): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true,
        info: {
          Title: 'PHARMACIES DE GARDE — BINGERVILLE',
          Author: 'PharmaGuard Bingerville',
          Subject: 'Répertoire des pharmacies de garde collectées',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const generatedAt = new Date().toLocaleString('fr-FR', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'UTC',
      });

      // --- HEADER ---
      doc.rect(40, 40, 515, 65).fill('#0f766e'); // Deep emerald
      doc.fillColor('#ffffff');
      doc.font('Helvetica-Bold').fontSize(16).text('PHARMACIES DE GARDE — BINGERVILLE', 55, 52);
      doc.font('Helvetica').fontSize(10).text('Répertoire des pharmacies collectées • Bingerville, Côte d\'Ivoire', 55, 74);
      doc.fontSize(8).text(`Généré le : ${generatedAt} UTC`, 55, 88);

      // --- METRICS / STATS BOX ---
      const statsY = 118;
      doc.rect(40, statsY, 515, 45).fill('#f1f5f9');
      doc.rect(40, statsY, 515, 45).stroke('#cbd5e1');

      const colW = 515 / 5;
      const statItems = [
        { label: 'Total', value: stats.total.toString() },
        { label: 'Vérifiées', value: stats.verified.toString() },
        { label: 'Avec Tél.', value: stats.withPhone.toString() },
        { label: 'Avec Email', value: stats.withEmail.toString() },
        { label: 'Géolocalisées', value: stats.withLocation.toString() },
      ];

      statItems.forEach((item, index) => {
        const x = 40 + index * colW;
        doc.fillColor('#0f766e').font('Helvetica-Bold').fontSize(12).text(item.value, x, statsY + 10, { width: colW, align: 'center' });
        doc.fillColor('#475569').font('Helvetica').fontSize(7.5).text(item.label, x, statsY + 26, { width: colW, align: 'center' });
      });

      // --- TABLE OF PHARMACIES ---
      let currentY = 175;

      const drawTableHeader = (y: number) => {
        doc.rect(40, y, 515, 20).fill('#047857');
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
        doc.text('#', 45, y + 6, { width: 20 });
        doc.text('Pharmacie / Statut', 70, y + 6, { width: 140 });
        doc.text('Téléphone', 215, y + 6, { width: 85 });
        doc.text('Email', 305, y + 6, { width: 85 });
        doc.text('Adresse', 395, y + 6, { width: 95 });
        doc.text('GPS', 495, y + 6, { width: 55 });
      };

      drawTableHeader(currentY);
      currentY += 20;

      pharmacies.forEach((p, idx) => {
        // Page break if near bottom
        if (currentY > 740) {
          doc.addPage();
          currentY = 45;
          drawTableHeader(currentY);
          currentY += 20;
        }

        const isEven = idx % 2 === 0;
        if (isEven) {
          doc.rect(40, currentY, 515, 28).fill('#f8fafc');
        }

        doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(7.5);
        doc.text((idx + 1).toString(), 45, currentY + 5, { width: 20 });

        // Pharmacy Name & Guard tag
        doc.text(p.name, 70, currentY + 5, { width: 140, ellipsis: true });
        doc.font('Helvetica').fontSize(6.5);
        if (p.garde_status === 'confirme') {
          doc.fillColor('#059669').text('● De garde confirmée', 70, currentY + 16, { width: 140 });
        } else {
          doc.fillColor('#64748b').text('Statut garde: non confirmé', 70, currentY + 16, { width: 140 });
        }

        // Phone
        doc.fillColor('#1e293b').font('Helvetica').fontSize(7);
        doc.text(p.phone || 'Non disponible', 215, currentY + 9, { width: 85, ellipsis: true });

        // Email
        doc.text(p.email || 'Non disponible', 305, currentY + 9, { width: 85, ellipsis: true });

        // Address
        doc.text(p.address || 'Bingerville (non précisée)', 395, currentY + 6, { width: 95, height: 20, ellipsis: true });

        // GPS
        const gpsStr = p.latitude != null && p.longitude != null
          ? `${p.latitude.toFixed(3)}, ${p.longitude.toFixed(3)}`
          : 'Non dispo';
        doc.text(gpsStr, 495, currentY + 9, { width: 55 });

        // Divider
        doc.moveTo(40, currentY + 28).lineTo(555, currentY + 28).strokeColor('#e2e8f0').stroke();
        currentY += 28;
      });

      // Add footers to all pages
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.rect(40, 785, 515, 0.5).strokeColor('#cbd5e1').stroke();
        doc.fillColor('#64748b').font('Helvetica').fontSize(7);
        doc.text(
          'Données collectées automatiquement — vérifier les informations avant utilisation.',
          40,
          793,
          { width: 400, align: 'left' }
        );
        doc.text(`Page ${i + 1} / ${range.count}`, 450, 793, { width: 105, align: 'right' });
      }

      doc.end();
    });
  }

  /**
   * Generates a Detailed PDF document (fiches individuelles par pharmacie).
   */
  public static async generateDetailedPdf(pharmacies: Pharmacy[], stats: DashboardStats): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true,
        info: {
          Title: 'PHARMACIES DE GARDE — BINGERVILLE (FICHES DÉTAILLÉES)',
          Author: 'PharmaGuard Bingerville',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const generatedAt = new Date().toLocaleString('fr-FR', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'UTC',
      });

      // Cover / Header Banner
      doc.rect(40, 40, 515, 60).fill('#064e3b');
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(16).text('PHARMACIES DE GARDE — BINGERVILLE', 55, 50);
      doc.font('Helvetica').fontSize(9).text(`Répertoire Détaillé • ${pharmacies.length} pharmacies répertoriées • ${generatedAt}`, 55, 72);

      let currentY = 115;

      pharmacies.forEach((p, idx) => {
        // Each card takes around 155pt height. 3 cards per page.
        if (currentY > 640) {
          doc.addPage();
          currentY = 45;
        }

        const cardH = 150;
        doc.rect(40, currentY, 515, cardH).fill('#ffffff').strokeColor('#cbd5e1').stroke();
        doc.rect(40, currentY, 515, 26).fill('#f1f5f9');

        // Card header
        doc.fillColor('#0f766e').font('Helvetica-Bold').fontSize(10);
        doc.text(`${idx + 1}. ${p.name}`, 50, currentY + 8, { width: 330, ellipsis: true });

        // Guard status pill
        const isGarde = p.garde_status === 'confirme';
        doc.font('Helvetica-Bold').fontSize(7.5);
        if (isGarde) {
          doc.fillColor('#059669').text('✓ DE GARDE CONFIRMÉE', 390, currentY + 8, { width: 155, align: 'right' });
        } else {
          doc.fillColor('#64748b').text('STATUT NON CONFIRMÉ', 390, currentY + 8, { width: 155, align: 'right' });
        }

        // Details grid
        const row1 = currentY + 34;
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#334155').text('Téléphone :', 50, row1);
        doc.font('Helvetica').fillColor('#0f172a').text(p.phone || 'Non disponible', 120, row1);

        if (p.secondary_phone) {
          doc.font('Helvetica').fillColor('#64748b').text(`(Secondaire: ${p.secondary_phone})`, 240, row1);
        }

        doc.font('Helvetica-Bold').fillColor('#334155').text('Email :', 360, row1);
        doc.font('Helvetica').fillColor('#0f172a').text(p.email || 'Non disponible', 405, row1);

        const row2 = currentY + 52;
        doc.font('Helvetica-Bold').fillColor('#334155').text('Adresse :', 50, row2);
        doc.font('Helvetica').fillColor('#0f172a').text(p.address || 'Bingerville, Côte d\'Ivoire (Non précisée)', 120, row2, { width: 420 });

        const row3 = currentY + 70;
        doc.font('Helvetica-Bold').fillColor('#334155').text('GPS :', 50, row3);
        const gpsLabel = p.latitude != null && p.longitude != null
          ? `Lat: ${p.latitude}, Lon: ${p.longitude}`
          : 'Coordonnées non disponibles';
        doc.font('Helvetica').fillColor('#0f172a').text(gpsLabel, 120, row3);

        const row4 = currentY + 88;
        doc.font('Helvetica-Bold').fillColor('#334155').text('Vérification :', 50, row4);
        const statusMap: Record<string, string> = {
          verifie: 'Vérifiée par opérateur',
          a_verifier: 'À vérifier (données complètes)',
          non_verifie: 'Non vérifiée',
          informations_incompletes: 'Informations incomplètes',
        };
        doc.font('Helvetica').fillColor('#0f172a').text(statusMap[p.verification_status] || p.verification_status, 120, row4);

        if (p.garde_start && p.garde_end) {
          doc.font('Helvetica-Bold').fillColor('#334155').text('Période garde :', 290, row4);
          const start = new Date(p.garde_start).toLocaleDateString('fr-FR');
          const end = new Date(p.garde_end).toLocaleDateString('fr-FR');
          doc.font('Helvetica').fillColor('#0f172a').text(`${start} au ${end}`, 370, row4);
        }

        const row5 = currentY + 106;
        doc.font('Helvetica-Bold').fillColor('#334155').text('Sources :', 50, row5);
        const srcNames = p.sources && p.sources.length > 0
          ? p.sources.map(s => s.source_name).join(', ')
          : 'Collecte publique';
        doc.font('Helvetica').fillColor('#475569').text(srcNames, 120, row5, { width: 420, ellipsis: true });

        const row6 = currentY + 124;
        if (p.notes) {
          doc.font('Helvetica-Bold').fillColor('#334155').text('Notes :', 50, row6);
          doc.font('Helvetica-Oblique').fillColor('#64748b').text(p.notes, 120, row6, { width: 420, ellipsis: true });
        }

        currentY += cardH + 15;
      });

      // Footers
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.rect(40, 785, 515, 0.5).strokeColor('#cbd5e1').stroke();
        doc.fillColor('#64748b').font('Helvetica').fontSize(7);
        doc.text(
          'Données collectées automatiquement — vérifier les informations avant utilisation.',
          40,
          793,
          { width: 400, align: 'left' }
        );
        doc.text(`Page ${i + 1} / ${range.count}`, 450, 793, { width: 105, align: 'right' });
      }

      doc.end();
    });
  }
}
