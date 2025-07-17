from django.urls import path
from .views import (
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    RegisterView,
    LoginView,
    LogoutView,
    ProfileView,
    ChangePasswordView,
    protected_test_view,
    CompanyViewSet,
    FinancialYearViewSet,
    UserActivityViewSet,
    get_filtered_financial_years,
    activate_company,
    activate_financial_year
)

app_name = 'common'

urlpatterns = [
    # Authentication endpoints
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('auth/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    # User profile endpoints
    path('auth/profile/', ProfileView.as_view(), name='profile'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change_password'),
    
    # Test endpoint
    path('auth/test/', protected_test_view, name='test_auth'),
    
    # Company endpoints
    path('companies/', CompanyViewSet.as_view({'get': 'list', 'post': 'create'}), name='company_list'),
    path('companies/<int:pk>/', CompanyViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='company_detail'),
    
    # Financial Year endpoints
    path('financial-years/', FinancialYearViewSet.as_view({'get': 'list', 'post': 'create'}), name='financial_year_list'),
    path('financial-years/<int:pk>/', FinancialYearViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='financial_year_detail'),
    path('financial-years/filtered/', get_filtered_financial_years, name='filtered_financial_years'),
    
    # User Activity endpoints
    path('user-activity/', UserActivityViewSet.as_view({'get': 'list', 'patch': 'partial_update'}), name='user_activity'),
    
    # Activation endpoints
    path('companies/<int:company_id>/activate/', activate_company, name='activate_company'),
    path('financial-years/<int:financial_year_id>/activate/', activate_financial_year, name='activate_financial_year'),
]