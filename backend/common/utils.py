from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from typing import Any, Optional, Dict
import requests
import logging
from django.conf import settings


class APIResponse:
    """
    Standardized API response utility for consistent responses across the application.
    
    Usage:
        return APIResponse.success(data={"user": user_data}, message="User created successfully")
        return APIResponse.error(message="Invalid credentials", status_code=400)
    """
    
    @staticmethod
    def _format_response(
        status_code: int,
        success: bool,
        message: str = "",
        data: Any = None,
        errors: Optional[Dict] = None
    ) -> Response:
        """
        Internal method to format the response consistently.
        
        Args:
            status_code: HTTP status code
            success: Boolean indicating if the request was successful
            message: Human-readable message
            data: Response data (can be any serializable type)
            errors: Error details (for validation errors, etc.)
        
        Returns:
            Response: DRF Response object with standardized format
        """
        response_data = {
            "status_code": status_code,
            "success": success,
            "message": message,
            "data": data,
        }
        
        if errors:
            response_data["errors"] = errors
            
        return Response(response_data, status=status_code)
    
    @staticmethod
    def success(
        data: Any = None,
        message: str = "Success",
        status_code: int = status.HTTP_200_OK
    ) -> Response:
        """
        Return a successful response.
        
        Args:
            data: Response data
            message: Success message
            status_code: HTTP status code (default: 200)
        
        Returns:
            Response: Standardized success response
        """
        return APIResponse._format_response(
            status_code=status_code,
            success=True,
            message=message,
            data=data
        )
    
    @staticmethod
    def error(
        message: str = "An error occurred",
        status_code: int = status.HTTP_400_BAD_REQUEST,
        errors: Optional[Dict] = None,
        data: Any = None
    ) -> Response:
        """
        Return an error response.
        
        Args:
            message: Error message
            status_code: HTTP status code (default: 400)
            errors: Error details
            data: Additional data (optional)
        
        Returns:
            Response: Standardized error response
        """
        return APIResponse._format_response(
            status_code=status_code,
            success=False,
            message=message,
            data=data,
            errors=errors
        )
    
    @staticmethod
    def validation_error(
        errors: Dict,
        message: str = "Validation failed"
    ) -> Response:
        """
        Return a validation error response.
        
        Args:
            errors: Validation error details
            message: Error message
        
        Returns:
            Response: Standardized validation error response
        """
        return APIResponse._format_response(
            status_code=status.HTTP_400_BAD_REQUEST,
            success=False,
            message=message,
            errors=errors
        )
    
    @staticmethod
    def not_found(message: str = "Resource not found") -> Response:
        """
        Return a 404 not found response.
        
        Args:
            message: Not found message
        
        Returns:
            Response: Standardized 404 response
        """
        return APIResponse._format_response(
            status_code=status.HTTP_404_NOT_FOUND,
            success=False,
            message=message
        )
    
    @staticmethod
    def unauthorized(message: str = "Unauthorized access") -> Response:
        """
        Return a 401 unauthorized response.
        
        Args:
            message: Unauthorized message
        
        Returns:
            Response: Standardized 401 response
        """
        return APIResponse._format_response(
            status_code=status.HTTP_401_UNAUTHORIZED,
            success=False,
            message=message
        )
    
    @staticmethod
    def forbidden(message: str = "Access forbidden") -> Response:
        """
        Return a 403 forbidden response.
        
        Args:
            message: Forbidden message
        
        Returns:
            Response: Standardized 403 response
        """
        return APIResponse._format_response(
            status_code=status.HTTP_403_FORBIDDEN,
            success=False,
            message=message
        )
    
    @staticmethod
    def created(
        data: Any = None,
        message: str = "Resource created successfully"
    ) -> Response:
        """
        Return a 201 created response.
        
        Args:
            data: Created resource data
            message: Success message
        
        Returns:
            Response: Standardized 201 response
        """
        return APIResponse._format_response(
            status_code=status.HTTP_201_CREATED,
            success=True,
            message=message,
            data=data
        )
    
    @staticmethod
    def no_content(message: str = "Operation completed successfully") -> Response:
        """
        Return a 204 no content response.
        
        Args:
            message: Success message
        
        Returns:
            Response: Standardized 204 response
        """
        return APIResponse._format_response(
            status_code=status.HTTP_204_NO_CONTENT,
            success=True,
            message=message
        )


def handle_serializer_errors(serializer) -> Dict:
    """
    Convert DRF serializer errors to a standardized format.
    
    Args:
        serializer: DRF serializer with errors
    
    Returns:
        Dict: Formatted error dictionary
    """
    formatted_errors = {}
    
    for field, errors in serializer.errors.items():
        if isinstance(errors, list):
            formatted_errors[field] = errors
        else:
            formatted_errors[field] = [str(errors)]
    
    return formatted_errors


def handle_exception_response(exception, context=None) -> Response:
    """
    Handle exceptions and return standardized error responses.
    
    Args:
        exception: The exception that occurred
        context: Additional context (optional)
    
    Returns:
        Response: Standardized error response
    """
    from rest_framework.views import exception_handler
    from django.core.exceptions import ValidationError
    from django.db import IntegrityError
    
    # Call REST framework's default exception handler first
    response = exception_handler(exception, context)
    
    if response is not None:
        # Use our custom format for DRF exceptions
        custom_response_data = {
            'status_code': response.status_code,
            'success': False,
            'message': 'An error occurred',
            'data': None,
            'errors': response.data
        }
        response.data = custom_response_data
        return response
    
    # Handle Django model validation errors
    if isinstance(exception, ValidationError):
        return APIResponse.validation_error(
            errors={'non_field_errors': exception.messages},
            message="Validation error"
        )
    
    # Handle database integrity errors
    if isinstance(exception, IntegrityError):
        return APIResponse.error(
            message="Database integrity error - this operation conflicts with existing data",
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    # Handle other exceptions
    return APIResponse.error(
        message="An unexpected error occurred",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    )


class StandardPagination(PageNumberPagination):
    """
    Standard pagination class for consistent pagination across the application.
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def get_paginated_response(self, data):
        """
        Return a paginated response with standardized format.
        
        Args:
            data: Serialized data for the current page
            
        Returns:
            Response: Standardized paginated response
        """
        return APIResponse.success(
            data={
                'results': data,
                'pagination': {
                    'count': self.page.paginator.count,
                    'next': self.get_next_link(),
                    'previous': self.get_previous_link(),
                    'current_page': self.page.number,
                    'total_pages': self.page.paginator.num_pages,
                    'page_size': self.get_page_size(self.request),
                    'has_next': self.page.has_next(),
                    'has_previous': self.page.has_previous(),
                }
            },
            message="Data retrieved successfully"
        )


logger = logging.getLogger(__name__)


class ReportClient:
    """
    Simple client for communicating with the JasperReports server.
    Makes direct HTTP requests to generate PDF reports.
    """
    
    def __init__(self):
        self.base_url = getattr(settings, 'REPORT_SERVER_URL', 'http://localhost:3502')
        self.timeout = 30  # 30 seconds timeout
    
    def generate_voucher_pdf(self, voucher_data: Dict) -> tuple[bool, bytes, str]:
        """
        Generate a voucher PDF report.
        
        Args:
            voucher_data: Dictionary containing voucher data
            
        Returns:
            tuple: (success: bool, pdf_bytes: bytes, error_message: str)
        """
        url = f"{self.base_url}/api/reports/voucher/pdf"
        
        try:
            logger.info(f"Generating voucher PDF report: {voucher_data.get('voucherNumber', 'Unknown')}")
            
            response = requests.post(
                url,
                json=voucher_data,
                timeout=self.timeout,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                logger.info("Voucher PDF generated successfully")
                return True, response.content, ""
            else:
                error_msg = f"Report server returned status {response.status_code}: {response.text}"
                logger.error(error_msg)
                return False, b"", error_msg
                
        except requests.exceptions.ConnectionError:
            error_msg = "Could not connect to report server. Please ensure the report server is running."
            logger.error(error_msg)
            return False, b"", error_msg
            
        except requests.exceptions.Timeout:
            error_msg = f"Report generation timed out after {self.timeout} seconds"
            logger.error(error_msg)
            return False, b"", error_msg
            
        except Exception as e:
            error_msg = f"Unexpected error generating report: {str(e)}"
            logger.error(error_msg)
            return False, b"", error_msg
    
    def check_server_health(self) -> bool:
        """
        Check if the report server is healthy and responding.
        
        Returns:
            bool: True if server is healthy, False otherwise
        """
        url = f"{self.base_url}/actuator/health"
        
        try:
            response = requests.get(url, timeout=5)
            return response.status_code == 200
        except Exception:
            return False


# Global report client instance
_report_client = None


def get_report_client() -> ReportClient:
    """
    Get the global report client instance.
    
    Returns:
        ReportClient: Global report client instance
    """
    global _report_client
    
    if _report_client is None:
        _report_client = ReportClient()
    
    return _report_client