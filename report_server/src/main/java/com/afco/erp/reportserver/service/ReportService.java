package com.afco.erp.reportserver.service;

import com.afco.erp.reportserver.dto.VoucherDto;
import com.afco.erp.reportserver.dto.VoucherLineDto;
import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

@Service
public class ReportService {

    public byte[] generateVoucherPdf(VoucherDto voucherDto) throws Exception {
        // Load the Jasper report template
        ClassPathResource resource = new ClassPathResource("reports/voucher_template.jrxml");
        InputStream reportStream = resource.getInputStream();
        
        // Compile the report
        JasperReport jasperReport = JasperCompileManager.compileReport(reportStream);
        
        // Create parameters map
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("voucherNumber", voucherDto.getVoucherNumber());
        parameters.put("voucherType", voucherDto.getVoucherType());
        parameters.put("voucherDate", voucherDto.getVoucherDate());
        parameters.put("description", voucherDto.getDescription() != null ? voucherDto.getDescription() : "");
        parameters.put("companyName", voucherDto.getCompanyName() != null ? voucherDto.getCompanyName() : "AFCO ERP");
        parameters.put("companyAddress", voucherDto.getCompanyAddress() != null ? voucherDto.getCompanyAddress() : "");
        parameters.put("totalAmount", voucherDto.getTotalAmount());
        
        // Create data source from line entries
        JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(voucherDto.getLineEntries());
        
        // Fill the report
        JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);
        
        // Export to PDF
        return JasperExportManager.exportReportToPdf(jasperPrint);
    }
}