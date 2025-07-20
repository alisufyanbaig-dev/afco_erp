from django.urls import path
from . import views

app_name = 'inventory'

urlpatterns = [
    # Parties (suppliers/customers)
    path('parties/', views.PartyListCreateView.as_view(), name='parties-list-create'),
    path('parties/<int:pk>/', views.PartyDetailView.as_view(), name='parties-detail'),
    path('parties/list/', views.parties_list, name='parties-list'),
    
    # HS Codes
    path('hs-codes/', views.HSCodeListCreateView.as_view(), name='hs-codes-list-create'),
    path('hs-codes/<int:pk>/', views.HSCodeDetailView.as_view(), name='hs-codes-detail'),
    
    # Categories
    path('categories/', views.CategoryListCreateView.as_view(), name='categories-list-create'),
    path('categories/<int:pk>/', views.CategoryDetailView.as_view(), name='categories-detail'),
    
    # Products
    path('products/', views.ProductListCreateView.as_view(), name='products-list-create'),
    path('products/<int:pk>/', views.ProductDetailView.as_view(), name='products-detail'),
    path('products/list/', views.products_list, name='products-list'),
    path('products/low-stock/', views.low_stock_products, name='low-stock-products'),
    
    # Stock Invoices
    path('stock-invoices/', views.StockInvoiceListCreateView.as_view(), name='stock-invoices-list-create'),
    path('stock-invoices/<int:pk>/', views.StockInvoiceDetailView.as_view(), name='stock-invoices-detail'),
    path('stock-invoices/<int:pk>/confirm/', views.confirm_stock_invoice, name='confirm-stock-invoice'),
    
    # Reports
    path('reports/stock-movement/', views.stock_movement_report, name='stock-movement-report'),
    path('reports/stock-valuation/', views.stock_valuation_report, name='stock-valuation-report'),
    
    # Utility endpoints
    path('invoice-types/', views.invoice_types, name='invoice-types'),
    path('unit-choices/', views.unit_choices, name='unit-choices'),
]