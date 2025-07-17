from django.contrib import admin
from django.utils.html import format_html
from django.db import models
from .models import ChartOfAccounts, Voucher, VoucherLineEntry


@admin.register(ChartOfAccounts)
class ChartOfAccountsAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'account_type', 'parent_display', 'is_group_account', 'company', 'is_active']
    list_filter = ['account_type', 'is_group_account', 'is_active', 'company']
    search_fields = ['code', 'name', 'description']
    autocomplete_fields = ['parent']
    readonly_fields = ['code', 'created_at', 'updated_at', 'level', 'full_path']
    fieldsets = (
        ('Basic Information', {
            'fields': ('company', 'name', 'account_type', 'parent', 'is_group_account', 'description')
        }),
        ('Auto-Generated Fields', {
            'fields': ('code', 'level', 'full_path'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('System Information', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def parent_display(self, obj):
        if obj.parent:
            return f"{obj.parent.code} - {obj.parent.name}"
        return "Root Account"
    parent_display.short_description = "Parent Account"
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('company', 'parent', 'created_by')
    
    def save_model(self, request, obj, form, change):
        if not change:  # Creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


class VoucherLineEntryInline(admin.TabularInline):
    model = VoucherLineEntry
    extra = 2
    fields = ['line_number', 'account', 'description', 'debit_amount', 'credit_amount']
    readonly_fields = ['line_number']
    autocomplete_fields = ['account']


@admin.register(Voucher)
class VoucherAdmin(admin.ModelAdmin):
    list_display = ['voucher_number', 'voucher_type', 'voucher_date', 'company', 'financial_year', 
                    'total_amount_display', 'is_balanced_display']
    list_filter = ['voucher_type', 'company', 'financial_year', 'voucher_date']
    search_fields = ['voucher_number', 'narration', 'reference']
    readonly_fields = ['voucher_number', 'total_debit', 'total_credit', 'is_balanced', 
                       'created_at', 'updated_at']
    date_hierarchy = 'voucher_date'
    
    fieldsets = (
        ('Voucher Information', {
            'fields': ('company', 'financial_year', 'voucher_type', 'voucher_date', 'voucher_number')
        }),
        ('Transaction Details', {
            'fields': ('narration', 'reference')
        }),
        ('Totals', {
            'fields': ('total_debit', 'total_credit', 'is_balanced'),
            'classes': ('collapse',)
        }),
        ('System Information', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    inlines = [VoucherLineEntryInline]
    
    def total_amount_display(self, obj):
        return f"Dr: {obj.total_debit} | Cr: {obj.total_credit}"
    total_amount_display.short_description = "Total Amount"
    
    def is_balanced_display(self, obj):
        if obj.is_balanced:
            return format_html('<span style="color: green;">✓ Balanced</span>')
        else:
            return format_html('<span style="color: red;">✗ Unbalanced</span>')
    is_balanced_display.short_description = "Balance Status"
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'company', 'financial_year', 'created_by'
        ).prefetch_related('line_entries')
    
    def save_model(self, request, obj, form, change):
        if not change:  # Creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
    
    def save_formset(self, request, form, formset, change):
        instances = formset.save(commit=False)
        for instance in instances:
            if isinstance(instance, VoucherLineEntry):
                if not instance.line_number:
                    # Auto-assign line number
                    max_line = VoucherLineEntry.objects.filter(
                        voucher=form.instance
                    ).aggregate(max_line=models.Max('line_number'))['max_line']
                    instance.line_number = (max_line or 0) + 1
                instance.save()
        formset.save_m2m()


@admin.register(VoucherLineEntry)
class VoucherLineEntryAdmin(admin.ModelAdmin):
    list_display = ['voucher', 'line_number', 'account', 'debit_amount', 'credit_amount', 'entry_type']
    list_filter = ['voucher__voucher_type', 'voucher__company', 'account__account_type']
    search_fields = ['voucher__voucher_number', 'account__name', 'account__code', 'description']
    readonly_fields = ['line_number', 'amount', 'entry_type']
    autocomplete_fields = ['voucher', 'account']
    
    fieldsets = (
        ('Line Entry Information', {
            'fields': ('voucher', 'line_number', 'account', 'description')
        }),
        ('Amounts', {
            'fields': ('debit_amount', 'credit_amount', 'amount', 'entry_type')
        }),
        ('System Information', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('voucher', 'account')
