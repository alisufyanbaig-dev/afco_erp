package com.afco.erp.reportserver.dto;

import java.math.BigDecimal;
import java.util.List;

public class VoucherDto {
    private String voucherNumber;
    private String voucherType;
    private String voucherDate;
    private String description;
    private BigDecimal totalAmount;
    private String companyName;
    private String companyAddress;
    private List<VoucherLineDto> lineEntries;

    // Constructors
    public VoucherDto() {}

    // Getters and Setters
    public String getVoucherNumber() {
        return voucherNumber;
    }

    public void setVoucherNumber(String voucherNumber) {
        this.voucherNumber = voucherNumber;
    }

    public String getVoucherType() {
        return voucherType;
    }

    public void setVoucherType(String voucherType) {
        this.voucherType = voucherType;
    }

    public String getVoucherDate() {
        return voucherDate;
    }

    public void setVoucherDate(String voucherDate) {
        this.voucherDate = voucherDate;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getCompanyAddress() {
        return companyAddress;
    }

    public void setCompanyAddress(String companyAddress) {
        this.companyAddress = companyAddress;
    }

    public List<VoucherLineDto> getLineEntries() {
        return lineEntries;
    }

    public void setLineEntries(List<VoucherLineDto> lineEntries) {
        this.lineEntries = lineEntries;
    }
}