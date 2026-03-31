import jsPDF from 'jspdf';

interface Activity {
  name: string;
  description?: string;
  location?: string;
  time?: string;
}

interface ItineraryDay {
  day: number;
  title: string;
  activities: Activity[];
}

interface TripData {
  destination: string;
  startDate?: string;
  endDate?: string;
  itinerary: ItineraryDay[];
  travelers?: number;
  budget?: string;
}

export async function generateTripPDF(tripData: TripData): Promise<void> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  const navy = [0, 68, 123] as const;
  const orange = [255, 130, 16] as const;
  const gray = '#6C6D6F';

  let y = margin;

  const addPageFooter = () => {
    const footerY = pageHeight - 10;
    pdf.setFontSize(8);
    pdf.setTextColor(gray);
    pdf.text('Crafted by Luna Lets Go | www.lunaletsgo.com', pageWidth / 2, footerY, { align: 'center' });
    pdf.setDrawColor(255, 189, 89);
    pdf.setLineWidth(0.3);
    pdf.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
  };

  const checkNewPage = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 20) {
      addPageFooter();
      pdf.addPage();
      y = margin;
    }
  };

  // Header bar
  pdf.setFillColor(...navy);
  pdf.rect(0, 0, pageWidth, 35, 'F');

  pdf.setFillColor(...orange);
  pdf.rect(0, 33, pageWidth, 2, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor('#FFFFFF');
  pdf.text("Luna Let's Go", margin, 16);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Your Personal Travel Itinerary', margin, 24);

  pdf.setFontSize(8);
  pdf.text(
    `Generated: ${new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    pageWidth - margin,
    16,
    { align: 'right' }
  );

  y = 45;

  // Trip summary box
  pdf.setFillColor(245, 249, 255);
  pdf.setDrawColor(...navy);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(margin, y, contentWidth, 28, 3, 3, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(...navy);
  pdf.text(tripData.destination, margin + 6, y + 9);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(gray);

  const summaryParts: string[] = [];
  if (tripData.startDate && tripData.endDate) summaryParts.push(`${tripData.startDate} to ${tripData.endDate}`);
  if (tripData.travelers) summaryParts.push(`${tripData.travelers} traveler${tripData.travelers > 1 ? 's' : ''}`);
  if (tripData.budget) summaryParts.push(`Budget: ${tripData.budget}`);
  if (summaryParts.length) pdf.text(summaryParts.join('   |   '), margin + 6, y + 17);

  pdf.setFillColor(...orange);
  pdf.circle(margin + 2, y + 8, 1.5, 'F');

  y += 36;

  // Itinerary days
  for (const day of tripData.itinerary) {
    if (!day.activities.length) continue;
    checkNewPage(22);

    pdf.setFillColor(...navy);
    pdf.roundedRect(margin, y, contentWidth, 10, 2, 2, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor('#FFFFFF');
    pdf.text(`Day ${day.day}  -  ${day.title}`, margin + 5, y + 7);

    y += 14;

    for (const activity of day.activities) {
      checkNewPage(16);

      pdf.setFillColor(...orange);
      pdf.circle(margin + 2.5, y + 3, 1.5, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor('#333333');

      const title = activity.time ? `${activity.time}  ${activity.name}` : activity.name;
      const titleLines = pdf.splitTextToSize(title, contentWidth - 10);
      pdf.text(titleLines, margin + 7, y + 4);
      y += titleLines.length * 5 + 2;

      if (activity.description) {
        checkNewPage(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        pdf.setTextColor(gray);
        const descLines = pdf.splitTextToSize(activity.description, contentWidth - 10);
        pdf.text(descLines, margin + 7, y + 3);
        y += descLines.length * 4.5 + 2;
      }

      if (activity.location) {
        checkNewPage(8);
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(8);
        pdf.setTextColor('#679AC1');
        pdf.text(`Location: ${activity.location}`, margin + 7, y + 2);
        y += 6;
      }

      y += 2;
    }

    y += 6;
  }

  addPageFooter();

  const filename = `luna-letsgo-${tripData.destination.toLowerCase().replace(/\s+/g, '-')}-itinerary.pdf`;
  pdf.save(filename);
}
