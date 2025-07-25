from django.urls import path
from . import views

app_name = 'accounting'

urlpatterns = [
    # Chart of Accounts URLs
    path('chart-of-accounts/', views.ChartOfAccountsListCreateView.as_view(), name='chart-of-accounts-list-create'),
    path('chart-of-accounts/<int:pk>/', views.ChartOfAccountsDetailView.as_view(), name='chart-of-accounts-detail'),
    path('chart-of-accounts/hierarchy/', views.chart_of_accounts_hierarchy, name='chart-of-accounts-hierarchy'),
    path('account-types/', views.account_types, name='account-types'),
    
    # Voucher URLs
    path('vouchers/', views.VoucherListCreateView.as_view(), name='voucher-list-create'),
    path('vouchers/<int:pk>/', views.VoucherDetailView.as_view(), name='voucher-detail'),
    path('voucher-types/', views.voucher_types, name='voucher-types'),
    
    # Reports URLs
    path('vouchers/<int:voucher_id>/pdf/', views.voucher_pdf_report, name='voucher-pdf-report'),
    path('ledger-report/', views.ledger_report, name='ledger-report'),
    path('trial-balance/', views.trial_balance, name='trial-balance'),
]