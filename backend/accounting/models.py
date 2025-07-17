from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db.models import Sum
from decimal import Decimal
from common.models import Company, User, FinancialYear


class ChartOfAccounts(models.Model):
    ACCOUNT_TYPES = [
        ('asset', 'Asset'),
        ('liability', 'Liability'),
        ('income', 'Income'),
        ('expense', 'Expense'),
    ]
    
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='chart_of_accounts')
    code = models.CharField(max_length=50, help_text='Auto-generated account code like 1, 1-1, 1-1-1')
    name = models.CharField(max_length=255)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPES)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='sub_accounts')
    is_control_account = models.BooleanField(default=False, help_text='Group/Control account that contains sub-accounts')
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True, null=True)
    
    # System fields
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'chart_of_accounts'
        verbose_name = 'Chart of Account'
        verbose_name_plural = 'Chart of Accounts'
        ordering = ['code']
        unique_together = ['company', 'code']
        constraints = [
            models.UniqueConstraint(
                fields=['company', 'name'],
                name='unique_account_name_per_company'
            )
        ]
    
    def __str__(self):
        return f"{self.code} - {self.name}"
    
    def clean(self):
        """Validate account hierarchy and type consistency"""
        if self.parent:
            # Child account must have same account type as parent
            if self.account_type != self.parent.account_type:
                raise ValidationError('Sub-account must have the same account type as its parent')
            
            # Parent must be from same company
            if self.company != self.parent.company:
                raise ValidationError('Parent account must be from the same company')
            
            # Parent should be a control account
            if not self.parent.is_control_account:
                raise ValidationError('Parent account must be a control account')
        
        # Root accounts (no parent) should be control accounts if they will have children
        if not self.parent and not self.is_control_account:
            # Check if this will be a main account type (1, 2, 3, 4)
            if self.code and len(self.code.split('-')) == 1:
                self.is_control_account = True
    
    def save(self, *args, **kwargs):
        # Auto-generate code if not provided
        if not self.code:
            self.code = self._generate_account_code()
        
        self.clean()
        super().save(*args, **kwargs)
    
    def _generate_account_code(self):
        """Generate unique account code based on hierarchy"""
        if not self.parent:
            # This is a root account, find next available main number
            existing_roots = ChartOfAccounts.objects.filter(
                company=self.company,
                parent__isnull=True
            ).values_list('code', flat=True)
            
            # Extract numeric codes and find next available
            used_numbers = []
            for code in existing_roots:
                try:
                    used_numbers.append(int(code))
                except (ValueError, TypeError):
                    continue
            
            # Start from 1 and find first available number
            next_number = 1
            while next_number in used_numbers:
                next_number += 1
            
            return str(next_number)
        else:
            # This is a sub-account, generate code based on parent
            parent_code = self.parent.code
            
            # Find existing sub-accounts under this parent
            existing_subs = ChartOfAccounts.objects.filter(
                company=self.company,
                parent=self.parent
            ).values_list('code', flat=True)
            
            # Extract the last segment numbers
            used_numbers = []
            for code in existing_subs:
                segments = code.split('-')
                if len(segments) > len(parent_code.split('-')):
                    try:
                        last_segment = int(segments[-1])
                        used_numbers.append(last_segment)
                    except (ValueError, TypeError):
                        continue
            
            # Find next available number for this level
            next_number = 1
            while next_number in used_numbers:
                next_number += 1
            
            return f"{parent_code}-{next_number}"
    
    @property
    def level(self):
        """Return the hierarchy level (0 for root, 1 for first level sub, etc.)"""
        return len(self.code.split('-')) - 1
    
    @property
    def full_path(self):
        """Return full path from root to this account"""
        if not self.parent:
            return self.name
        return f"{self.parent.full_path} > {self.name}"
    
    def get_children(self):
        """Get all direct children of this account"""
        return self.sub_accounts.filter(is_active=True).order_by('code')
    
    def get_descendants(self):
        """Get all descendants (children, grandchildren, etc.) of this account"""
        descendants = []
        for child in self.get_children():
            descendants.append(child)
            descendants.extend(child.get_descendants())
        return descendants
    
    def can_be_deleted(self):
        """Check if account can be deleted (no sub-accounts and no transactions)"""
        if self.sub_accounts.exists():
            return False, "Cannot delete account with sub-accounts"
        
        # TODO: Add check for transactions when transaction models are created
        # if self.transactions.exists():
        #     return False, "Cannot delete account with transactions"
        
        return True, "Account can be deleted"
    
    @classmethod
    def get_account_hierarchy(cls, company, account_type=None):
        """Get hierarchical structure of accounts for a company"""
        filters = {'company': company, 'is_active': True}
        if account_type:
            filters['account_type'] = account_type
        
        # Get root accounts first
        root_accounts = cls.objects.filter(parent__isnull=True, **filters).order_by('code')
        
        def build_tree(accounts):
            tree = []
            for account in accounts:
                node = {
                    'account': account,
                    'children': build_tree(account.get_children().filter(**filters))
                }
                tree.append(node)
            return tree
        
        return build_tree(root_accounts)


class Voucher(models.Model):
    VOUCHER_TYPES = [
        ('cash', 'Cash Voucher'),
        ('bank', 'Bank Voucher'), 
        ('journal', 'Journal Voucher'),
    ]
    
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='vouchers')
    financial_year = models.ForeignKey(FinancialYear, on_delete=models.CASCADE, related_name='vouchers')
    voucher_type = models.CharField(max_length=20, choices=VOUCHER_TYPES)
    voucher_number = models.CharField(max_length=50, help_text='Auto-generated voucher number')
    voucher_date = models.DateField()
    
    # Transaction details
    narration = models.TextField(help_text='Description of the transaction')
    reference = models.CharField(max_length=255, blank=True, null=True, help_text='External reference number')
    
    # Status and control
    is_posted = models.BooleanField(default=False, help_text='Whether voucher is posted to accounts')
    is_approved = models.BooleanField(default=False, help_text='Whether voucher is approved')
    
    # System fields
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_vouchers')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_vouchers')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'vouchers'
        verbose_name = 'Voucher'
        verbose_name_plural = 'Vouchers'
        ordering = ['-voucher_date', '-voucher_number']
        unique_together = ['company', 'financial_year', 'voucher_type', 'voucher_number']
        constraints = []
    
    def __str__(self):
        return f"{self.get_voucher_type_display()} - {self.voucher_number}"
    
    def clean(self):
        """Validate voucher data"""
        if self.financial_year and self.company:
            if self.financial_year.company != self.company:
                raise ValidationError('Financial year must belong to the same company')
        
        if self.voucher_date and self.financial_year:
            if not (self.financial_year.start_date <= self.voucher_date <= self.financial_year.end_date):
                raise ValidationError('Voucher date must be within the financial year period')
    
    def save(self, *args, **kwargs):
        # Auto-generate voucher number if not provided
        if not self.voucher_number:
            self.voucher_number = self._generate_voucher_number()
        
        self.clean()
        super().save(*args, **kwargs)
    
    def _generate_voucher_number(self):
        """Generate unique voucher number per company, year, and type"""
        # Get the latest voucher number for this combination
        latest_voucher = Voucher.objects.filter(
            company=self.company,
            financial_year=self.financial_year,
            voucher_type=self.voucher_type
        ).order_by('-voucher_number').first()
        
        if latest_voucher:
            try:
                # Extract the numeric part from the voucher number
                # Expected format: CV-2024-0001, BV-2024-0001, JV-2024-0001
                parts = latest_voucher.voucher_number.split('-')
                if len(parts) >= 3:
                    last_number = int(parts[-1])
                    next_number = last_number + 1
                else:
                    next_number = 1
            except (ValueError, IndexError):
                next_number = 1
        else:
            next_number = 1
        
        # Generate prefix based on voucher type
        prefix_map = {
            'cash': 'CV',
            'bank': 'BV', 
            'journal': 'JV'
        }
        prefix = prefix_map.get(self.voucher_type, 'VV')
        
        # Get year from financial year
        year = self.financial_year.start_date.year
        
        # Format: CV-2024-0001
        return f"{prefix}-{year}-{next_number:04d}"
    
    @property
    def total_debit(self):
        """Calculate total debit amount"""
        return self.line_entries.aggregate(
            total=Sum('debit_amount', default=Decimal('0'))
        )['total'] or Decimal('0')
    
    @property
    def total_credit(self):
        """Calculate total credit amount"""
        return self.line_entries.aggregate(
            total=Sum('credit_amount', default=Decimal('0'))
        )['total'] or Decimal('0')
    
    @property
    def is_balanced(self):
        """Check if voucher is balanced (total debit = total credit)"""
        return self.total_debit == self.total_credit
    
    def post_voucher(self, user):
        """Post voucher to accounts"""
        if not self.is_balanced:
            raise ValidationError('Cannot post unbalanced voucher')
        
        if self.is_posted:
            raise ValidationError('Voucher is already posted')
        
        # TODO: Create actual ledger entries when ledger models are created
        self.is_posted = True
        self.approved_by = user
        self.is_approved = True
        self.save()
    
    def can_be_edited(self):
        """Check if voucher can be edited"""
        if self.is_posted:
            return False, "Cannot edit posted voucher"
        if self.is_approved:
            return False, "Cannot edit approved voucher"
        return True, "Voucher can be edited"
    
    def can_be_deleted(self):
        """Check if voucher can be deleted"""
        if self.is_posted:
            return False, "Cannot delete posted voucher"
        return True, "Voucher can be deleted"


class VoucherLineEntry(models.Model):
    voucher = models.ForeignKey(Voucher, on_delete=models.CASCADE, related_name='line_entries')
    account = models.ForeignKey(ChartOfAccounts, on_delete=models.PROTECT, related_name='voucher_entries')
    
    # Amounts - only one should be non-zero
    debit_amount = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0'), validators=[MinValueValidator(Decimal('0'))])
    credit_amount = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0'), validators=[MinValueValidator(Decimal('0'))])
    
    # Line details
    description = models.TextField(blank=True, null=True, help_text='Description for this line entry')
    line_number = models.PositiveIntegerField(help_text='Line sequence number')
    
    # System fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'voucher_line_entries'
        verbose_name = 'Voucher Line Entry'
        verbose_name_plural = 'Voucher Line Entries'
        ordering = ['line_number']
        unique_together = ['voucher', 'line_number']
        constraints = [
            models.CheckConstraint(
                check=~(models.Q(debit_amount__gt=0) & models.Q(credit_amount__gt=0)),
                name='not_both_debit_and_credit'
            ),
            models.CheckConstraint(
                check=models.Q(debit_amount__gt=0) | models.Q(credit_amount__gt=0),
                name='either_debit_or_credit'
            )
        ]
    
    def __str__(self):
        amount = self.debit_amount if self.debit_amount > 0 else self.credit_amount
        entry_type = "Dr" if self.debit_amount > 0 else "Cr"
        return f"{self.account.code} - {self.account.name} ({entry_type} {amount})"
    
    def clean(self):
        """Validate line entry"""
        # Check that account belongs to same company as voucher
        if self.account and self.voucher:
            if self.account.company != self.voucher.company:
                raise ValidationError('Account must belong to the same company as voucher')
        
        # Check that exactly one of debit or credit is non-zero
        if self.debit_amount > 0 and self.credit_amount > 0:
            raise ValidationError('Line entry cannot have both debit and credit amounts')
        
        if self.debit_amount == 0 and self.credit_amount == 0:
            raise ValidationError('Line entry must have either debit or credit amount')
        
        # Control accounts cannot have direct entries
        if self.account and self.account.is_control_account:
            raise ValidationError('Cannot post entries to control accounts')
    
    def save(self, *args, **kwargs):
        # Auto-assign line number if not provided
        if not self.line_number:
            max_line = VoucherLineEntry.objects.filter(voucher=self.voucher).aggregate(
                max_line=models.Max('line_number')
            )['max_line']
            self.line_number = (max_line or 0) + 1
        
        self.clean()
        super().save(*args, **kwargs)
    
    @property
    def amount(self):
        """Return the non-zero amount"""
        return self.debit_amount if self.debit_amount > 0 else self.credit_amount
    
    @property
    def entry_type(self):
        """Return 'debit' or 'credit'"""
        return 'debit' if self.debit_amount > 0 else 'credit'
