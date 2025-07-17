from rest_framework import status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import login
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend

from .models import User, Company, FinancialYear, UserActivity
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    ChangePasswordSerializer,
    CompanySerializer,
    UserActivitySerializer,
    FinancialYearSerializer
)
from .utils import APIResponse, handle_serializer_errors, StandardPagination


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT token obtain view with standardized response format.
    """
    serializer_class = CustomTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            return APIResponse.success(
                data=serializer.validated_data,
                message="Login successful"
            )
        else:
            return APIResponse.validation_error(
                errors=handle_serializer_errors(serializer),
                message="Invalid credentials"
            )


class CustomTokenRefreshView(TokenRefreshView):
    """
    Custom JWT token refresh view with standardized response format.
    """
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            return APIResponse.success(
                data=serializer.validated_data,
                message="Token refreshed successfully"
            )
        else:
            return APIResponse.validation_error(
                errors=handle_serializer_errors(serializer),
                message="Invalid refresh token"
            )


class RegisterView(APIView):
    """
    User registration view.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate JWT tokens for the new user
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            user_data = UserProfileSerializer(user).data
            
            response_data = {
                'user': user_data,
                'access': str(access_token),
                'refresh': str(refresh),
            }
            
            return APIResponse.created(
                data=response_data,
                message="Account created successfully"
            )
        else:
            return APIResponse.validation_error(
                errors=handle_serializer_errors(serializer),
                message="Registration failed"
            )


class LoginView(APIView):
    """
    User login view.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = UserLoginSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            user_data = UserProfileSerializer(user).data
            
            response_data = {
                'user': user_data,
                'access': str(access_token),
                'refresh': str(refresh),
            }
            
            return APIResponse.success(
                data=response_data,
                message="Login successful"
            )
        else:
            return APIResponse.validation_error(
                errors=handle_serializer_errors(serializer),
                message="Login failed"
            )


class LogoutView(APIView):
    """
    User logout view.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            return APIResponse.success(
                message="Logout successful"
            )
        except Exception as e:
            return APIResponse.error(
                message="Logout failed",
                status_code=status.HTTP_400_BAD_REQUEST
            )


class ProfileView(APIView):
    """
    User profile view.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get user profile."""
        serializer = UserProfileSerializer(request.user)
        return APIResponse.success(
            data=serializer.data,
            message="Profile retrieved successfully"
        )
    
    def put(self, request):
        """Update user profile."""
        serializer = UserProfileSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            return APIResponse.success(
                data=serializer.data,
                message="Profile updated successfully"
            )
        else:
            return APIResponse.validation_error(
                errors=handle_serializer_errors(serializer),
                message="Profile update failed"
            )


class ChangePasswordView(APIView):
    """
    Change user password view.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            return APIResponse.success(
                message="Password changed successfully"
            )
        else:
            return APIResponse.validation_error(
                errors=handle_serializer_errors(serializer),
                message="Password change failed"
            )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def protected_test_view(request):
    """
    Test view to verify JWT authentication is working.
    """
    return APIResponse.success(
        data={
            'message': 'This is a protected endpoint',
            'user': {
                'id': request.user.id,
                'email': request.user.email,
                'full_name': request.user.get_full_name(),
            }
        },
        message="Authentication verified"
    )


class CompanyViewSet(ModelViewSet):
    """
    ViewSet for Company CRUD operations with search and filtering.
    """
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['province', 'business_type', 'is_active']
    search_fields = ['name', 'legal_name', 'ntn', 'strn', 'city', 'email']
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['name']
    
    def get_queryset(self):
        """
        Optionally restricts the returned companies based on user permissions.
        """
        queryset = Company.objects.select_related('created_by')
        
        # Add any additional filtering logic here if needed
        # For now, return all companies for authenticated users
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Create a new company."""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            company = serializer.save()
            return APIResponse.created(
                data=serializer.data,
                message="Company created successfully"
            )
        return APIResponse.validation_error(
            errors=handle_serializer_errors(serializer),
            message="Company creation failed"
        )
    
    def list(self, request, *args, **kwargs):
        """List companies with pagination and search."""
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            data=serializer.data,
            message="Companies retrieved successfully"
        )
    
    def retrieve(self, request, *args, **kwargs):
        """Retrieve a specific company."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return APIResponse.success(
            data=serializer.data,
            message="Company retrieved successfully"
        )
    
    def update(self, request, *args, **kwargs):
        """Update a company."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return APIResponse.success(
                data=serializer.data,
                message="Company updated successfully"
            )
        return APIResponse.validation_error(
            errors=handle_serializer_errors(serializer),
            message="Company update failed"
        )
    
    def destroy(self, request, *args, **kwargs):
        """Delete a company and all related data with proper CASCADE handling."""
        from django.db import transaction
        from django.db.models import ProtectedError
        
        instance = self.get_object()
        
        try:
            with transaction.atomic():
                # Clear any user activities that reference this company
                # This must be done before deletion since UserActivity uses SET_NULL
                UserActivity.objects.filter(current_company=instance).update(
                    current_company=None,
                    current_financial_year=None
                )
                
                # Delete the company - this will CASCADE to:
                # - FinancialYear (and their associated data)
                # - ChartOfAccounts
                # - Voucher (and their VoucherEntry records)
                # - Any other related data with CASCADE relationships
                instance.delete()
                
            return APIResponse.success(
                message="Company and all related data deleted successfully"
            )
        except ProtectedError as e:
            return APIResponse.error(
                message="Cannot delete company because it has related data that cannot be removed",
                status_code=400
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Failed to delete company: {str(e)}",
                status_code=500
            )


class FinancialYearViewSet(ModelViewSet):
    """
    ViewSet for FinancialYear CRUD operations with search and filtering.
    """
    serializer_class = FinancialYearSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['company']
    search_fields = ['name', 'company__name']
    ordering_fields = ['name', 'start_date', 'end_date', 'created_at']
    ordering = ['-start_date']
    
    def get_queryset(self):
        """
        Filter financial years by user's activated company
        """
        # Get user's current activity
        activity = UserActivity.objects.filter(user=self.request.user).first()
        
        if not activity or not activity.current_company:
            # Return empty queryset if no company is activated
            return FinancialYear.objects.none()
        
        # Return financial years for the activated company
        return FinancialYear.objects.filter(
            company=activity.current_company
        ).select_related('company', 'created_by')
    
    def create(self, request, *args, **kwargs):
        """Create a new financial year for the currently activated company."""
        # Get user's current activity
        activity = UserActivity.objects.filter(user=self.request.user).first()
        
        if not activity or not activity.current_company:
            return APIResponse.error(
                message="Please activate a company first before creating financial years"
            )
        
        # Automatically assign the financial year to the activated company
        data = request.data.copy()
        data['company'] = activity.current_company.id
        
        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            financial_year = serializer.save()
            return APIResponse.created(
                data=serializer.data,
                message="Financial year created successfully"
            )
        return APIResponse.validation_error(
            errors=handle_serializer_errors(serializer),
            message="Financial year creation failed"
        )
    
    def list(self, request, *args, **kwargs):
        """List financial years with pagination and search."""
        # Check if user has activated a company
        activity = UserActivity.objects.filter(user=self.request.user).first()
        
        if not activity or not activity.current_company:
            return APIResponse.success(
                data={
                    'results': [],
                    'pagination': {
                        'count': 0,
                        'next': None,
                        'previous': None,
                        'current_page': 1,
                        'total_pages': 1,
                        'page_size': 20,
                        'has_next': False,
                        'has_previous': False,
                    }
                },
                message="Please activate a company first to view financial years"
            )
        
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            data=serializer.data,
            message="Financial years retrieved successfully"
        )
    
    def retrieve(self, request, *args, **kwargs):
        """Retrieve a specific financial year."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return APIResponse.success(
            data=serializer.data,
            message="Financial year retrieved successfully"
        )
    
    def update(self, request, *args, **kwargs):
        """Update a financial year."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return APIResponse.success(
                data=serializer.data,
                message="Financial year updated successfully"
            )
        return APIResponse.validation_error(
            errors=handle_serializer_errors(serializer),
            message="Financial year update failed"
        )
    
    def destroy(self, request, *args, **kwargs):
        """Delete a financial year."""
        instance = self.get_object()
        instance.delete()
        return APIResponse.success(
            message="Financial year deleted successfully"
        )


class UserActivityViewSet(ModelViewSet):
    """
    ViewSet for managing user activity (current company and financial year)
    """
    serializer_class = UserActivitySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return user activity for the current user only"""
        return UserActivity.objects.filter(user=self.request.user)
    
    def get_object(self):
        """Get or create user activity for the current user"""
        activity, created = UserActivity.objects.get_or_create(
            user=self.request.user,
            defaults={
                'current_company': None,
                'current_financial_year': None
            }
        )
        return activity
    
    def list(self, request, *args, **kwargs):
        """Get current user activity"""
        activity = self.get_object()
        serializer = self.get_serializer(activity)
        return APIResponse.success(
            data=serializer.data,
            message="User activity retrieved successfully"
        )
    
    def partial_update(self, request, *args, **kwargs):
        """Update user activity"""
        activity = self.get_object()
        serializer = self.get_serializer(activity, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return APIResponse.success(
                data=serializer.data,
                message="User activity updated successfully"
            )
        return APIResponse.validation_error(
            errors=handle_serializer_errors(serializer),
            message="User activity update failed"
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_filtered_financial_years(request):
    """
    Get financial years filtered by current user's activated company
    """
    try:
        # Get user's current activity
        activity = UserActivity.objects.filter(user=request.user).first()
        
        if not activity or not activity.current_company:
            return APIResponse.success(
                data=[],
                message="No activated company found"
            )
        
        # Get financial years for the activated company
        financial_years = FinancialYear.objects.filter(
            company=activity.current_company
        ).order_by('-start_date')
        
        serializer = FinancialYearSerializer(financial_years, many=True)
        return APIResponse.success(
            data=serializer.data,
            message="Filtered financial years retrieved successfully"
        )
    except Exception as e:
        return APIResponse.error(
            message=f"Error retrieving filtered financial years: {str(e)}"
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def activate_company(request, company_id):
    """
    Activate a company for the current user
    """
    try:
        # Get the company
        company = Company.objects.get(id=company_id)
        
        # Get or create user activity
        activity, created = UserActivity.objects.get_or_create(
            user=request.user,
            defaults={
                'current_company': company,
                'current_financial_year': None
            }
        )
        
        # Update the current company
        activity.current_company = company
        # Clear the financial year since company changed
        activity.current_financial_year = None
        activity.save()
        
        return APIResponse.success(
            data={
                'company_id': company.id,
                'company_name': company.name
            },
            message=f"Company '{company.name}' activated successfully"
        )
    except Company.DoesNotExist:
        return APIResponse.error(
            message="Company not found or inactive"
        )
    except Exception as e:
        return APIResponse.error(
            message=f"Error activating company: {str(e)}"
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def activate_financial_year(request, financial_year_id):
    """
    Activate a financial year for the current user
    """
    try:
        # Get the financial year
        financial_year = FinancialYear.objects.get(id=financial_year_id)
        
        # Get or create user activity
        activity, created = UserActivity.objects.get_or_create(
            user=request.user,
            defaults={
                'current_company': financial_year.company,
                'current_financial_year': financial_year
            }
        )
        
        # Ensure the financial year belongs to the current company
        if activity.current_company != financial_year.company:
            return APIResponse.error(
                message="Financial year must belong to the current activated company"
            )
        
        # Update the current financial year
        activity.current_financial_year = financial_year
        activity.save()
        
        return APIResponse.success(
            data={
                'financial_year_id': financial_year.id,
                'financial_year_name': financial_year.name,
                'company_id': financial_year.company.id,
                'company_name': financial_year.company.name
            },
            message=f"Financial year '{financial_year.name}' activated successfully"
        )
    except FinancialYear.DoesNotExist:
        return APIResponse.error(
            message="Financial year not found or inactive"
        )
    except Exception as e:
        return APIResponse.error(
            message=f"Error activating financial year: {str(e)}"
        )
