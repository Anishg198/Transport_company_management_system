package com.tccs.controller;

import com.tccs.repository.TruckRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TransportManager','SystemAdministrator')")
public class ReportController {

    private final EntityManager em;
    private final TruckRepository truckRepository;

    @GetMapping("/revenue")
    public ResponseEntity<?> revenue(@RequestParam(required = false) String startDate,
                                      @RequestParam(required = false) String endDate) {
        LocalDate start = startDate != null ? LocalDate.parse(startDate) : LocalDate.now().minusYears(2);
        LocalDate end   = endDate   != null ? LocalDate.parse(endDate)   : LocalDate.now();

        List<Object[]> revenueByDest = em.createNativeQuery(
                "SELECT destination, COUNT(*) as total_consignments, " +
                "ROUND(CAST(SUM(transport_charges) AS numeric),2) as total_revenue, " +
                "ROUND(CAST(AVG(transport_charges) AS numeric),2) as avg_revenue, " +
                "ROUND(CAST(SUM(volume) AS numeric),2) as total_volume, " +
                "COUNT(CASE WHEN status='Delivered' THEN 1 END) as delivered_count, " +
                "COUNT(CASE WHEN status='Cancelled' THEN 1 END) as cancelled_count " +
                "FROM consignments WHERE DATE(registration_timestamp) BETWEEN :start AND :end " +
                "AND status != 'Cancelled' GROUP BY destination ORDER BY SUM(transport_charges) DESC")
                .setParameter("start", start).setParameter("end", end).getResultList();

        List<Object[]> daily = em.createNativeQuery(
                "SELECT DATE(registration_timestamp) as date, " +
                "ROUND(CAST(SUM(transport_charges) AS numeric),2) as revenue, COUNT(*) as consignments " +
                "FROM consignments WHERE DATE(registration_timestamp) BETWEEN :start AND :end " +
                "AND status != 'Cancelled' GROUP BY DATE(registration_timestamp) ORDER BY date ASC")
                .setParameter("start", start).setParameter("end", end).getResultList();

        List<Object[]> summary = em.createNativeQuery(
                "SELECT ROUND(CAST(SUM(transport_charges) AS numeric),2), COUNT(*), " +
                "ROUND(CAST(AVG(transport_charges) AS numeric),2), ROUND(CAST(SUM(volume) AS numeric),2) " +
                "FROM consignments WHERE DATE(registration_timestamp) BETWEEN :start AND :end " +
                "AND status != 'Cancelled'")
                .setParameter("start", start).setParameter("end", end).getResultList();

        Object[] s = (Object[]) summary.get(0);
        Map<String, Object> summaryMap = new LinkedHashMap<>();
        summaryMap.put("total_revenue", s[0]);
        summaryMap.put("total_consignments", s[1]);
        summaryMap.put("avg_charge", s[2]);
        summaryMap.put("total_volume", s[3]);

        return ResponseEntity.ok(Map.of(
                "revenueByDestination", rowsToMaps(revenueByDest, "destination","total_consignments","total_revenue","avg_revenue","total_volume","delivered_count","cancelled_count"),
                "dailyRevenue", rowsToMaps(daily, "date","revenue","consignments"),
                "summary", summaryMap,
                "dateRange", Map.of("start", start.toString(), "end", end.toString())
        ));
    }

    @GetMapping("/performance")
    public ResponseEntity<?> performance(@RequestParam(required = false) String startDate,
                                          @RequestParam(required = false) String endDate) {
        LocalDate start = startDate != null ? LocalDate.parse(startDate) : LocalDate.now().minusYears(2);
        LocalDate end   = endDate   != null ? LocalDate.parse(endDate)   : LocalDate.now();

        List<Object[]> waiting = em.createNativeQuery(
                "SELECT destination, " +
                "AVG(EXTRACT(EPOCH FROM (CAST(CAST(status_change_log AS jsonb)->-1->>'timestamp' AS timestamptz) - registration_timestamp))/3600) as avg_waiting_hours, " +
                "COUNT(*) as count " +
                "FROM consignments WHERE DATE(registration_timestamp) BETWEEN :start AND :end " +
                "AND status IN ('InTransit','Delivered') GROUP BY destination ORDER BY avg_waiting_hours DESC")
                .setParameter("start", start).setParameter("end", end).getResultList();

        List<Object[]> utilization = em.createNativeQuery(
                "SELECT t.truck_id, t.registration_number, t.driver_name, t.capacity, " +
                "COUNT(d.dispatch_id) as total_trips, COALESCE(SUM(d.total_volume),0) as total_volume_transported, " +
                "COALESCE(AVG(d.total_volume/t.capacity*100),0) as avg_utilization_percent, " +
                "COUNT(CASE WHEN d.dispatch_status='Delivered' THEN 1 END) as completed_trips " +
                "FROM trucks t LEFT JOIN dispatch_documents d ON t.truck_id=d.truck_id " +
                "AND DATE(d.dispatch_timestamp) BETWEEN :start AND :end " +
                "GROUP BY t.truck_id, t.registration_number, t.driver_name, t.capacity ORDER BY avg_utilization_percent DESC")
                .setParameter("start", start).setParameter("end", end).getResultList();

        List<Object[]> statusDist = em.createNativeQuery(
                "SELECT status, COUNT(*) as count FROM consignments " +
                "WHERE DATE(registration_timestamp) BETWEEN :start AND :end GROUP BY status")
                .setParameter("start", start).setParameter("end", end).getResultList();

        return ResponseEntity.ok(Map.of(
                "waitingTimeByDestination", rowsToMaps(waiting, "destination","avg_waiting_hours","count"),
                "truckUtilization", rowsToMaps(utilization, "truck_id","registration_number","driver_name","capacity","total_trips","total_volume_transported","avg_utilization_percent","completed_trips"),
                "statusDistribution", rowsToMaps(statusDist, "status","count"),
                "dateRange", Map.of("start", start.toString(), "end", end.toString())
        ));
    }

    @GetMapping("/truck-usage")
    public ResponseEntity<?> truckUsage(@RequestParam(required = false) String startDate,
                                         @RequestParam(required = false) String endDate) {
        LocalDate start = startDate != null ? LocalDate.parse(startDate) : LocalDate.now().minusYears(2);
        LocalDate end   = endDate   != null ? LocalDate.parse(endDate)   : LocalDate.now();

        List<Object[]> rows = em.createNativeQuery(
                "SELECT t.truck_id, t.registration_number, t.driver_name, t.capacity, t.status, t.current_location, " +
                "COUNT(DISTINCT d.dispatch_id) as trips_completed, COALESCE(SUM(d.total_volume),0) as total_volume_transported, " +
                "COALESCE(SUM(d.total_consignments),0) as total_consignments_delivered, " +
                "COALESCE(AVG(CASE WHEN d.arrival_time IS NOT NULL THEN EXTRACT(EPOCH FROM (d.arrival_time-d.departure_time))/3600 END),0) as avg_trip_hours, " +
                "ROUND(CAST(COALESCE(AVG(d.total_volume/t.capacity*100),0) AS numeric),1) as avg_utilization_pct " +
                "FROM trucks t LEFT JOIN dispatch_documents d ON t.truck_id=d.truck_id " +
                "AND DATE(d.dispatch_timestamp) BETWEEN :start AND :end " +
                "GROUP BY t.truck_id, t.registration_number, t.driver_name, t.capacity, t.status, t.current_location " +
                "ORDER BY trips_completed DESC")
                .setParameter("start", start).setParameter("end", end).getResultList();

        return ResponseEntity.ok(Map.of(
                "truckUsage", rowsToMaps(rows, "truck_id","registration_number","driver_name","capacity","current_status","current_location","trips_completed","total_volume_transported","total_consignments_delivered","avg_trip_hours","avg_utilization_pct"),
                "dateRange", Map.of("start", start.toString(), "end", end.toString())
        ));
    }

    @GetMapping("/export/excel")
    public ResponseEntity<byte[]> exportExcel(@RequestParam(required = false) String startDate,
                                               @RequestParam(required = false) String endDate,
                                               @RequestParam(defaultValue = "all") String type) throws Exception {
        LocalDate start = startDate != null ? LocalDate.parse(startDate) : LocalDate.now().minusYears(2);
        LocalDate end   = endDate   != null ? LocalDate.parse(endDate)   : LocalDate.now();

        try (Workbook workbook = new XSSFWorkbook()) {
            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            Sheet sheet = workbook.createSheet("Revenue Report");
            String[] headers = {"Destination","Consignments","Revenue (INR)","Avg Revenue","Volume (m3)","Delivered"};
            Row hRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = hRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            List<Object[]> data = em.createNativeQuery(
                    "SELECT destination, COUNT(*), ROUND(CAST(SUM(transport_charges) AS numeric),2), " +
                    "ROUND(CAST(AVG(transport_charges) AS numeric),2), ROUND(CAST(SUM(volume) AS numeric),2), " +
                    "COUNT(CASE WHEN status='Delivered' THEN 1 END) " +
                    "FROM consignments WHERE DATE(registration_timestamp) BETWEEN :start AND :end AND status!='Cancelled' " +
                    "GROUP BY destination ORDER BY SUM(transport_charges) DESC")
                    .setParameter("start", start).setParameter("end", end).getResultList();

            int rowNum = 1;
            for (Object[] row : data) {
                Row r = sheet.createRow(rowNum++);
                for (int i = 0; i < row.length; i++) {
                    r.createCell(i).setCellValue(row[i] != null ? row[i].toString() : "");
                }
            }
            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            workbook.write(baos);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=TCCS_Report_" + start + "_to_" + end + ".xlsx")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(baos.toByteArray());
        }
    }

    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPdf(@RequestParam(required = false) String startDate,
                                             @RequestParam(required = false) String endDate) throws Exception {
        LocalDate start = startDate != null ? LocalDate.parse(startDate) : LocalDate.now().minusYears(2);
        LocalDate end   = endDate   != null ? LocalDate.parse(endDate)   : LocalDate.now();

        List<Object[]> data = em.createNativeQuery(
                "SELECT destination, COUNT(*), ROUND(CAST(SUM(transport_charges) AS numeric),2), ROUND(CAST(SUM(volume) AS numeric),2) " +
                "FROM consignments WHERE DATE(registration_timestamp) BETWEEN :start AND :end AND status!='Cancelled' " +
                "GROUP BY destination ORDER BY SUM(transport_charges) DESC")
                .setParameter("start", start).setParameter("end", end).getResultList();

        com.itextpdf.text.Document document = new com.itextpdf.text.Document();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        com.itextpdf.text.pdf.PdfWriter.getInstance(document, baos);
        document.open();

        com.itextpdf.text.Font titleFont = new com.itextpdf.text.Font(com.itextpdf.text.Font.FontFamily.HELVETICA, 18, com.itextpdf.text.Font.BOLD);
        com.itextpdf.text.Font headerFont = new com.itextpdf.text.Font(com.itextpdf.text.Font.FontFamily.HELVETICA, 11, com.itextpdf.text.Font.BOLD);
        com.itextpdf.text.Font bodyFont = new com.itextpdf.text.Font(com.itextpdf.text.Font.FontFamily.HELVETICA, 10);

        document.add(new com.itextpdf.text.Paragraph("TCCS Revenue Report", titleFont));
        document.add(new com.itextpdf.text.Paragraph("Period: " + start + " to " + end, bodyFont));
        document.add(com.itextpdf.text.Chunk.NEWLINE);

        com.itextpdf.text.pdf.PdfPTable table = new com.itextpdf.text.pdf.PdfPTable(4);
        table.setWidthPercentage(100);
        for (String h : new String[]{"Destination", "Consignments", "Revenue (INR)", "Volume (m³)"}) {
            com.itextpdf.text.pdf.PdfPCell cell = new com.itextpdf.text.pdf.PdfPCell(new com.itextpdf.text.Phrase(h, headerFont));
            cell.setBackgroundColor(new com.itextpdf.text.BaseColor(0, 102, 255));
            cell.setPadding(6);
            table.addCell(cell);
        }

        BigDecimal total = BigDecimal.ZERO;
        for (Object[] row : data) {
            table.addCell(new com.itextpdf.text.Phrase(String.valueOf(row[0]), bodyFont));
            table.addCell(new com.itextpdf.text.Phrase(String.valueOf(row[1]), bodyFont));
            BigDecimal rev = row[2] != null ? new BigDecimal(row[2].toString()) : BigDecimal.ZERO;
            total = total.add(rev);
            table.addCell(new com.itextpdf.text.Phrase("INR " + String.format("%,.2f", rev.doubleValue()), bodyFont));
            table.addCell(new com.itextpdf.text.Phrase(String.valueOf(row[3]), bodyFont));
        }
        document.add(table);
        document.add(com.itextpdf.text.Chunk.NEWLINE);
        document.add(new com.itextpdf.text.Paragraph("Total Revenue: INR " + String.format("%,.2f", total.doubleValue()), headerFont));

        document.close();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=TCCS_Revenue_" + start + "_to_" + end + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(baos.toByteArray());
    }

    private List<Map<String, Object>> rowsToMaps(List<Object[]> rows, String... keys) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            for (int i = 0; i < keys.length && i < row.length; i++) {
                m.put(keys[i], row[i]);
            }
            result.add(m);
        }
        return result;
    }
}
