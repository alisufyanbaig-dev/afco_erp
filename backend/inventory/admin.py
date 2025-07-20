from django.contrib import admin
from .models import HSCode, Category, Product, StockInvoice, StockInvoiceLineItem


@admin.register(HSCode)
class HSCodeAdmin(admin.ModelAdmin):
    list_display = ['code', 'description', 'company', 'is_active', 'created_at']
    list_filter = ['company', 'is_active', 'created_at']
    search_fields = ['code', 'description']
    ordering = ['code']


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'hs_code', 'company', 'is_active', 'created_at']
    list_filter = ['company', 'hs_code', 'is_active', 'created_at']
    search_fields = ['name', 'description', 'hs_code__code']
    ordering = ['name']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'category', 'unit_of_measure', 'current_stock', 'cost_price', 'selling_price', 'is_active']
    list_filter = ['company', 'category', 'unit_of_measure', 'is_active', 'created_at']
    search_fields = ['code', 'name', 'description', 'barcode']
    ordering = ['code']
    readonly_fields = ['current_stock']


class StockInvoiceLineItemInline(admin.TabularInline):
    model = StockInvoiceLineItem
    extra = 1
    readonly_fields = ['total_value', 'gst_amount']


@admin.register(StockInvoice)
class StockInvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'invoice_type', 'party_name', 'invoice_date', 'total_amount', 'status', 'company']
    list_filter = ['company', 'financial_year', 'invoice_type', 'status', 'invoice_date']
    search_fields = ['invoice_number', 'party_name', 'reference_number']
    ordering = ['-invoice_date', '-invoice_number']
    readonly_fields = ['invoice_number', 'subtotal', 'total_gst', 'total_amount']
    inlines = [StockInvoiceLineItemInline]


@admin.register(StockInvoiceLineItem)
class StockInvoiceLineItemAdmin(admin.ModelAdmin):
    list_display = ['stock_invoice', 'product', 'quantity', 'unit_price', 'total_value', 'gst_amount']
    list_filter = ['stock_invoice__company', 'stock_invoice__invoice_type', 'product__category']
    search_fields = ['stock_invoice__invoice_number', 'product__code', 'product__name']
    readonly_fields = ['total_value', 'gst_amount']