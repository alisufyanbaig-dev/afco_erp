package com.afco.erp.reportserver.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for report generation.
 */
@Configuration
@ConfigurationProperties(prefix = "afco.erp.report")
public class ReportConfiguration {
    
    private int timeout = 30000;
    private int maxConcurrentReports = 10;
    private String tempDirectory = System.getProperty("java.io.tmpdir") + "/afco-reports";
    private String templateDirectory = "classpath:reports/";
    private String defaultFormat = "PDF";
    private boolean cacheTemplates = true;
    private int poolSize = 5;
    
    // Getters and setters
    public int getTimeout() {
        return timeout;
    }
    
    public void setTimeout(int timeout) {
        this.timeout = timeout;
    }
    
    public int getMaxConcurrentReports() {
        return maxConcurrentReports;
    }
    
    public void setMaxConcurrentReports(int maxConcurrentReports) {
        this.maxConcurrentReports = maxConcurrentReports;
    }
    
    public String getTempDirectory() {
        return tempDirectory;
    }
    
    public void setTempDirectory(String tempDirectory) {
        this.tempDirectory = tempDirectory;
    }
    
    public String getTemplateDirectory() {
        return templateDirectory;
    }
    
    public void setTemplateDirectory(String templateDirectory) {
        this.templateDirectory = templateDirectory;
    }
    
    public String getDefaultFormat() {
        return defaultFormat;
    }
    
    public void setDefaultFormat(String defaultFormat) {
        this.defaultFormat = defaultFormat;
    }
    
    public boolean isCacheTemplates() {
        return cacheTemplates;
    }
    
    public void setCacheTemplates(boolean cacheTemplates) {
        this.cacheTemplates = cacheTemplates;
    }
    
    public int getPoolSize() {
        return poolSize;
    }
    
    public void setPoolSize(int poolSize) {
        this.poolSize = poolSize;
    }
}