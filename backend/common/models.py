from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
from django.core.validators import RegexValidator


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    phone = models.CharField(max_length=15, blank=True, null=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return self.email
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    def get_short_name(self):
        return self.first_name


class Company(models.Model):
    name = models.CharField(max_length=255)
    legal_name = models.CharField(max_length=255, blank=True, null=True)
    
    # Pakistani business details
    ntn = models.CharField(
        max_length=20, 
        blank=True, 
        null=True,
        validators=[RegexValidator(
            regex=r'^\d{7}-\d{1}$',
            message='NTN must be in format 1234567-8'
        )],
        help_text='National Tax Number (Format: 1234567-8)'
    )
    strn = models.CharField(
        max_length=20, 
        blank=True, 
        null=True,
        help_text='Sales Tax Registration Number'
    )
    
    # Address details
    address_line_1 = models.CharField(max_length=255)
    address_line_2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100)
    province = models.CharField(max_length=100, choices=[
        ('punjab', 'Punjab'),
        ('sindh', 'Sindh'),
        ('kpk', 'Khyber Pakhtunkhwa'),
        ('balochistan', 'Balochistan'),
        ('gilgit_baltistan', 'Gilgit-Baltistan'),
        ('azad_kashmir', 'Azad Kashmir'),
        ('islamabad', 'Islamabad Capital Territory'),
    ])
    postal_code = models.CharField(max_length=10, blank=True, null=True)
    country = models.CharField(max_length=100, default='Pakistan')
    
    # Contact details
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    
    # Business details
    business_type = models.CharField(max_length=100, choices=[
        ('sole_proprietorship', 'Sole Proprietorship'),
        ('partnership', 'Partnership'),
        ('private_limited', 'Private Limited Company'),
        ('public_limited', 'Public Limited Company'),
        ('ngo', 'Non-Governmental Organization'),
        ('government', 'Government Organization'),
        ('other', 'Other'),
    ], default='private_limited')
    
    # System fields
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_companies')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'companies'
        verbose_name = 'Company'
        verbose_name_plural = 'Companies'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class FinancialYear(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='financial_years')
    name = models.CharField(max_length=100, help_text='e.g., FY 2024-25')
    start_date = models.DateField()
    end_date = models.DateField()
    
    # System fields
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    is_current = models.BooleanField(default=False, help_text='Mark as current active financial year')
    
    class Meta:
        db_table = 'financial_years'
        verbose_name = 'Financial Year'
        verbose_name_plural = 'Financial Years'
        ordering = ['-start_date']
        unique_together = ['company', 'start_date', 'end_date']
        constraints = [
            models.CheckConstraint(
                check=models.Q(end_date__gt=models.F('start_date')),
                name='end_date_after_start_date'
            )
        ]
    
    def __str__(self):
        return f"{self.company.name} - {self.name}"
    
    def save(self, *args, **kwargs):
        # Ensure only one current financial year per company
        if self.is_current:
            FinancialYear.objects.filter(
                company=self.company, 
                is_current=True
            ).exclude(id=self.id).update(is_current=False)
        
        super().save(*args, **kwargs)
    
    @property
    def duration_months(self):
        """Calculate duration in months"""
        return (self.end_date.year - self.start_date.year) * 12 + (self.end_date.month - self.start_date.month)
