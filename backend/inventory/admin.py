from django.contrib import admin
from .models import Party, HSCode, Category, Product, StockInvoice, StockInvoiceLineItem, StockMovement


@admin.register(Party)
class PartyAdmin(admin.ModelAdmin):
    list_display = ['name', 'party_type', 'phone', 'email', 'company', 'is_active', 'created_at']
    list_filter = ['company', 'party_type', 'is_active', 'created_at']
    search_fields = ['name', 'contact_person', 'phone', 'email', 'ntn', 'strn']
    ordering = ['name']


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
    readonly_fields = ['amount_ex_gst', 'amount_inc_gst', 'total_value', 'gst_amount']


@admin.register(StockInvoice)
class StockInvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'invoice_type', 'party', 'invoice_date', 'total_amount', 'company']
    list_filter = ['company', 'financial_year', 'invoice_type', 'invoice_date']
    search_fields = ['invoice_number', 'party__name', 'reference_number']
    ordering = ['-invoice_date', '-invoice_number']
    readonly_fields = ['invoice_number', 'subtotal', 'total_gst', 'total_amount']
    inlines = [StockInvoiceLineItemInline]


@admin.register(StockInvoiceLineItem)
class StockInvoiceLineItemAdmin(admin.ModelAdmin):
    list_display = ['stock_invoice', 'product', 'quantity', 'unit_price', 'gst_rate', 'amount_inc_gst']
    list_filter = ['stock_invoice__company', 'stock_invoice__invoice_type', 'product__category']
    search_fields = ['stock_invoice__invoice_number', 'product__code', 'product__name']
    readonly_fields = ['amount_ex_gst', 'amount_inc_gst', 'total_value', 'gst_amount']


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ['movement_date', 'product', 'movement_type', 'reference_number', 'quantity_in', 'quantity_out', 'balance_quantity', 'average_cost', 'party']
    list_filter = ['company', 'financial_year', 'movement_type', 'movement_date', 'product__category__hs_code']
    search_fields = ['product__code', 'product__name', 'reference_number', 'party__name']
    readonly_fields = ['balance_quantity', 'balance_value', 'average_cost', 'created_at', 'updated_at']
    ordering = ['-movement_date', '-created_at']
    
    fieldsets = (
        ('Movement Details', {
            'fields': ('company', 'financial_year', 'product', 'movement_type', 'movement_date', 'reference_number', 'party')
        }),
        ('Quantity & Cost', {
            'fields': ('quantity_in', 'quantity_out', 'balance_quantity', 'unit_cost', 'average_cost')
        }),
        ('Value Details', {
            'fields': ('value_in', 'value_out', 'balance_value')
        }),
        ('GST Information', {
            'fields': ('gst_rate', 'gst_amount_in', 'gst_amount_out')
        }),
        ('References', {
            'fields': ('stock_invoice', 'line_item'),
            'classes': ('collapse',)
        }),
        ('System Fields', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )