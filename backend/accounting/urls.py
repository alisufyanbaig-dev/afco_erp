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
    path('vouchers/<int:pk>/post/', views.post_voucher, name='post-voucher'),
    path('voucher-types/', views.voucher_types, name='voucher-types'),
]