from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import User, Company, FinancialYear, UserActivity


class CustomUserCreationForm(UserCreationForm):
    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name')


class CustomUserChangeForm(UserChangeForm):
    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'phone', 'is_active', 'is_staff', 'is_superuser')


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = User
    
    list_display = ('email', 'first_name', 'last_name', 'is_staff', 'is_active', 'date_joined')
    list_filter = ('is_staff', 'is_active', 'date_joined')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'phone')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2'),
        }),
    )


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'province', 'business_type', 'is_active', 'created_at')
    list_filter = ('province', 'business_type', 'is_active', 'created_at')
    search_fields = ('name', 'legal_name', 'ntn', 'city', 'email')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'legal_name', 'business_type')
        }),
        ('Tax Information', {
            'fields': ('ntn', 'strn')
        }),
        ('Address', {
            'fields': ('address_line_1', 'address_line_2', 'city', 'province', 'postal_code', 'country')
        }),
        ('Contact Information', {
            'fields': ('phone', 'email', 'website')
        }),
        ('System Information', {
            'fields': ('created_by', 'is_active', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(FinancialYear)
class FinancialYearAdmin(admin.ModelAdmin):
    list_display = ('name', 'company', 'start_date', 'end_date')
    list_filter = ('company', 'start_date')
    search_fields = ('name', 'company__name')
    readonly_fields = ('created_at', 'updated_at', 'duration_months')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('company', 'name', 'start_date', 'end_date')
        }),
        ('System Information', {
            'fields': ('created_by', 'created_at', 'updated_at', 'duration_months'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
    
    def duration_months(self, obj):
        return f"{obj.duration_months} months"
    duration_months.short_description = 'Duration'


@admin.register(UserActivity)
class UserActivityAdmin(admin.ModelAdmin):
    list_display = ('user', 'current_company', 'current_financial_year', 'updated_at')
    list_filter = ('current_company', 'updated_at')
    search_fields = ('user__email', 'current_company__name', 'current_financial_year__name')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('User Information', {
            'fields': ('user',),
        }),
        ('Current Activity', {
            'fields': ('current_company', 'current_financial_year'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
