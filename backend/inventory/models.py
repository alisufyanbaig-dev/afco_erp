from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db.models import Sum
from decimal import Decimal
from common.models import Company, User, FinancialYear


class Party(models.Model):
    """Parties for stock invoices (suppliers/customers)"""
    PARTY_TYPES = [
        ('supplier', 'Supplier'),
        ('customer', 'Customer'),
        ('both', 'Both'),
    ]
    
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='parties')
    
    # Basic information
    name = models.CharField(max_length=255)
    party_type = models.CharField(max_length=20, choices=PARTY_TYPES, default='both')
    
    # Contact information
    contact_person = models.CharField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    
    # Address information
    address_line_1 = models.CharField(max_length=255, blank=True, null=True)
    address_line_2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    
    # Business information
    ntn = models.CharField(max_length=20, blank=True, null=True, help_text='National Tax Number')
    strn = models.CharField(max_length=30, blank=True, null=True, help_text='Sales Tax Registration Number')
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # System fields
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'parties'
        verbose_name = 'Party'
        verbose_name_plural = 'Parties'
        ordering = ['name']
        unique_together = ['company', 'name']
    
    def __str__(self):
        return self.name
    
    def clean(self):
        """Validate party data"""
        if self.ntn:
            # Basic NTN validation (format: 1234567-8)
            if not self.ntn.replace('-', '').isdigit() or len(self.ntn.replace('-', '')) < 7:
                raise ValidationError('Invalid NTN format')


class HSCode(models.Model):
    """HS Code (Harmonized System) for product classification"""
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='hs_codes')
    code = models.CharField(max_length=20, help_text='HS Code (e.g., 8471.30.00)')
    description = models.CharField(max_length=500)
    is_active = models.BooleanField(default=True)
    
    # System fields
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'hs_codes'
        verbose_name = 'HS Code'
        verbose_name_plural = 'HS Codes'
        ordering = ['code']
        unique_together = ['company', 'code']
    
    def __str__(self):
        return f"{self.code} - {self.description}"
    
    def clean(self):
        """Validate HS Code format"""
        if self.code:
            # Basic validation - HS codes are typically 6-10 digits with optional dots
            code_digits = self.code.replace('.', '')
            if not code_digits.isdigit() or len(code_digits) < 6:
                raise ValidationError('HS Code must contain at least 6 digits')


class Category(models.Model):
    """Product categories under HS Codes"""
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='categories')
    hs_code = models.ForeignKey(HSCode, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    # System fields
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'categories'
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
        ordering = ['name']
        unique_together = ['company', 'hs_code', 'name']
    
    def __str__(self):
        return f"{self.hs_code.code} - {self.name}"
    
    def clean(self):
        """Validate category belongs to same company as HS Code"""
        if self.hs_code and self.company:
            if self.hs_code.company != self.company:
                raise ValidationError('Category must belong to the same company as its HS Code')


class Product(models.Model):
    """Products under categories"""
    UNIT_CHOICES = [
        ('pcs', 'Pieces'),
        ('kg', 'Kilograms'),
        ('ltr', 'Liters'),
        ('mtr', 'Meters'),
        ('sqm', 'Square Meters'),
        ('cbm', 'Cubic Meters'),
        ('box', 'Box'),
        ('carton', 'Carton'),
        ('dozen', 'Dozen'),
        ('pack', 'Pack'),
        ('set', 'Set'),
        ('roll', 'Roll'),
        ('sheet', 'Sheet'),
        ('ton', 'Ton'),
        ('gram', 'Gram'),
    ]
    
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='products')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    
    # Product identification
    code = models.CharField(max_length=50, help_text='Product SKU/Code')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    
    # Product specifications
    unit_of_measure = models.CharField(max_length=20, choices=UNIT_CHOICES, default='pcs')
    barcode = models.CharField(max_length=100, blank=True, null=True)
    
    # Pricing
    cost_price = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0'), validators=[MinValueValidator(Decimal('0'))])
    selling_price = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0'), validators=[MinValueValidator(Decimal('0'))])
    
    # Stock tracking
    current_stock = models.DecimalField(max_digits=15, decimal_places=3, default=Decimal('0'))
    minimum_stock = models.DecimalField(max_digits=15, decimal_places=3, default=Decimal('0'), validators=[MinValueValidator(Decimal('0'))])
    maximum_stock = models.DecimalField(max_digits=15, decimal_places=3, default=Decimal('0'), validators=[MinValueValidator(Decimal('0'))])
    
    # Tax information
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'), validators=[MinValueValidator(Decimal('0'))], help_text='GST rate percentage')
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # System fields
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'products'
        verbose_name = 'Product'
        verbose_name_plural = 'Products'
        ordering = ['code', 'name']
        unique_together = ['company', 'code']
        constraints = [
            models.UniqueConstraint(
                fields=['company', 'name'],
                name='unique_product_name_per_company'
            ),
            models.CheckConstraint(
                check=models.Q(maximum_stock__gte=models.F('minimum_stock')),
                name='max_stock_gte_min_stock'
            )
        ]
    
    def __str__(self):
        return f"{self.code} - {self.name}"
    
    def clean(self):
        """Validate product belongs to same company as category"""
        if self.category and self.company:
            if self.category.company != self.company:
                raise ValidationError('Product must belong to the same company as its category')
        
        # Validate GST rate is reasonable (0-100%)
        if self.gst_rate > 100:
            raise ValidationError('GST rate cannot be more than 100%')
    
    @property
    def is_low_stock(self):
        """Check if current stock is below minimum stock level"""
        return self.current_stock <= self.minimum_stock
    
    @property
    def stock_value(self):
        """Calculate current stock value based on cost price"""
        return self.current_stock * self.cost_price


class StockInvoice(models.Model):
    """Stock invoices for various transactions"""
    INVOICE_TYPES = [
        ('purchase', 'Purchase'),
        ('sale', 'Sale'),
        ('export', 'Export'),
        ('import', 'Import'),
        ('sale_return', 'Sale Return'),
        ('purchase_return', 'Purchase Return'),
        ('adjustment', 'Stock Adjustment'),
    ]
    
    # Note: Removed status choices - all invoices are posted immediately
    
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='stock_invoices')
    financial_year = models.ForeignKey(FinancialYear, on_delete=models.CASCADE, related_name='stock_invoices')
    
    # Invoice details
    invoice_type = models.CharField(max_length=20, choices=INVOICE_TYPES)
    invoice_number = models.CharField(max_length=50, help_text='Auto-generated invoice number')
    invoice_date = models.DateField()
    
    # Party details (supplier/customer)
    party = models.ForeignKey(Party, on_delete=models.PROTECT, related_name='stock_invoices', null=True, blank=True)
    
    # Reference information
    reference_number = models.CharField(max_length=100, blank=True, null=True, help_text='External reference/PO number')
    
    # Financial totals
    subtotal = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0'))
    total_gst = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0'))
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0'))
    
    # Notes
    notes = models.TextField(blank=True, null=True)
    
    # System fields
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_stock_invoices')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'stock_invoices'
        verbose_name = 'Stock Invoice'
        verbose_name_plural = 'Stock Invoices'
        ordering = ['-invoice_date', '-invoice_number']
        unique_together = ['company', 'financial_year', 'invoice_type', 'invoice_number']
    
    def __str__(self):
        return f"{self.get_invoice_type_display()} - {self.invoice_number}"
    
    def clean(self):
        """Validate stock invoice data"""
        if self.financial_year and self.company:
            if self.financial_year.company != self.company:
                raise ValidationError('Financial year must belong to the same company')
        
        if self.invoice_date and self.financial_year:
            if not (self.financial_year.start_date <= self.invoice_date <= self.financial_year.end_date):
                raise ValidationError('Invoice date must be within the financial year period')
    
    def save(self, *args, **kwargs):
        # Auto-generate invoice number if not provided
        if not self.invoice_number:
            self.invoice_number = self._generate_invoice_number()
        
        self.clean()
        super().save(*args, **kwargs)
    
    def _generate_invoice_number(self):
        """Generate unique invoice number per company, year, and type"""
        # Get the latest invoice number for this combination
        latest_invoice = StockInvoice.objects.filter(
            company=self.company,
            financial_year=self.financial_year,
            invoice_type=self.invoice_type
        ).order_by('-invoice_number').first()
        
        if latest_invoice:
            try:
                # Extract the numeric part from the invoice number
                # Expected format: PUR-2024-0001, SAL-2024-0001, etc.
                parts = latest_invoice.invoice_number.split('-')
                if len(parts) >= 3:
                    last_number = int(parts[-1])
                    next_number = last_number + 1
                else:
                    next_number = 1
            except (ValueError, IndexError):
                next_number = 1
        else:
            next_number = 1
        
        # Generate prefix based on invoice type
        prefix_map = {
            'purchase': 'PUR',
            'sale': 'SAL',
            'export': 'EXP',
            'import': 'IMP',
            'sale_return': 'SR',
            'purchase_return': 'PR',
            'adjustment': 'ADJ'
        }
        prefix = prefix_map.get(self.invoice_type, 'INV')
        
        # Get year from financial year
        year = self.financial_year.start_date.year
        
        # Format: PUR-2024-0001
        return f"{prefix}-{year}-{next_number:04d}"
    
    def calculate_totals(self):
        """Calculate and update invoice totals from line items"""
        line_items = self.line_items.all()
        
        subtotal = Decimal('0')
        total_gst = Decimal('0')
        
        for item in line_items:
            subtotal += item.total_value
            total_gst += item.gst_amount
        
        self.subtotal = subtotal
        self.total_gst = total_gst
        self.total_amount = subtotal + total_gst
    
    def update_stock(self):
        """Update product stock based on invoice type (all invoices are posted immediately)"""
        for line_item in self.line_items.all():
            product = line_item.product
            quantity = line_item.quantity
            
            # Determine stock movement direction
            if self.invoice_type in ['purchase', 'import', 'sale_return']:
                # Increase stock
                product.current_stock += quantity
            elif self.invoice_type in ['sale', 'export', 'purchase_return']:
                # Decrease stock
                product.current_stock -= quantity
            elif self.invoice_type == 'adjustment':
                # Direct adjustment to quantity specified
                product.current_stock = quantity
            
            product.save(update_fields=['current_stock'])


class StockInvoiceLineItem(models.Model):
    """Line items for stock invoices"""
    stock_invoice = models.ForeignKey(StockInvoice, on_delete=models.CASCADE, related_name='line_items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='stock_movements')
    
    # Quantity and pricing
    quantity = models.DecimalField(max_digits=15, decimal_places=3, validators=[MinValueValidator(Decimal('0.001'))])
    unit_price = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('0'))])
    total_value = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0'))
    
    # GST calculation
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'), validators=[MinValueValidator(Decimal('0'))])
    gst_amount = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0'))
    
    # Line details
    amount_ex_gst = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0'), help_text='Amount excluding GST')
    gst_value = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0'), help_text='GST amount value')
    amount_inc_gst = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0'), help_text='Amount including GST')
    line_number = models.PositiveIntegerField(help_text='Line sequence number')
    
    # System fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'stock_invoice_line_items'
        verbose_name = 'Stock Invoice Line Item'
        verbose_name_plural = 'Stock Invoice Line Items'
        ordering = ['line_number']
        unique_together = ['stock_invoice', 'line_number']
    
    def __str__(self):
        return f"{self.product.code} - {self.product.name} (Qty: {self.quantity})"
    
    def clean(self):
        """Validate line item data"""
        # Check that product belongs to same company as invoice
        if self.product and self.stock_invoice:
            if self.product.company != self.stock_invoice.company:
                raise ValidationError('Product must belong to the same company as stock invoice')
        
        # Validate GST rate is reasonable (0-100%)
        if self.gst_rate > 100:
            raise ValidationError('GST rate cannot be more than 100%')
    
    def save(self, *args, **kwargs):
        # Auto-assign line number if not provided
        if not self.line_number:
            max_line = StockInvoiceLineItem.objects.filter(stock_invoice=self.stock_invoice).aggregate(
                max_line=models.Max('line_number')
            )['max_line']
            self.line_number = (max_line or 0) + 1
        
        # Calculate values based on what's provided
        if self.gst_rate and not self.gst_value:
            # Calculate GST value from rate
            self.amount_ex_gst = self.quantity * self.unit_price
            self.gst_value = (self.amount_ex_gst * self.gst_rate) / Decimal('100')
            self.amount_inc_gst = self.amount_ex_gst + self.gst_value
        elif self.gst_value and not self.gst_rate:
            # Calculate GST rate from value
            self.amount_ex_gst = self.quantity * self.unit_price
            if self.amount_ex_gst > 0:
                self.gst_rate = (self.gst_value * Decimal('100')) / self.amount_ex_gst
            self.amount_inc_gst = self.amount_ex_gst + self.gst_value
        else:
            # Default calculation
            self.amount_ex_gst = self.quantity * self.unit_price
            self.gst_value = (self.amount_ex_gst * self.gst_rate) / Decimal('100')
            self.amount_inc_gst = self.amount_ex_gst + self.gst_value
        
        # Legacy compatibility
        self.total_value = self.amount_ex_gst
        self.gst_amount = self.gst_value
        
        self.clean()
        super().save(*args, **kwargs)
        
        # Update parent invoice totals
        self.stock_invoice.calculate_totals()
        self.stock_invoice.save(update_fields=['subtotal', 'total_gst', 'total_amount'])
        
        # Create stock movement record
        StockMovement.create_from_line_item(self)
    
    @property
    def total_with_gst(self):
        """Return total value including GST"""
        return self.amount_inc_gst


class StockMovement(models.Model):
    """Track all stock movements with cost allocation for reporting"""
    MOVEMENT_TYPES = [
        ('purchase', 'Purchase'),
        ('sale', 'Sale'),
        ('export', 'Export'),
        ('import', 'Import'),
        ('sale_return', 'Sale Return'),
        ('purchase_return', 'Purchase Return'),
        ('adjustment', 'Stock Adjustment'),
        ('opening', 'Opening Stock'),
    ]
    
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='stock_movements')
    financial_year = models.ForeignKey(FinancialYear, on_delete=models.CASCADE, related_name='stock_movements')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_movements_detailed')
    
    # Movement details
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPES)
    movement_date = models.DateField()
    reference_number = models.CharField(max_length=100, help_text='Invoice/Document number')
    
    # Quantity details
    quantity_in = models.DecimalField(max_digits=15, decimal_places=3, default=Decimal('0'), help_text='Quantity received')
    quantity_out = models.DecimalField(max_digits=15, decimal_places=3, default=Decimal('0'), help_text='Quantity issued')
    balance_quantity = models.DecimalField(max_digits=15, decimal_places=3, default=Decimal('0'), help_text='Running balance')
    
    # Cost allocation (average cost method)
    unit_cost = models.DecimalField(max_digits=15, decimal_places=4, default=Decimal('0'), help_text='Unit cost at transaction')
    average_cost = models.DecimalField(max_digits=15, decimal_places=4, default=Decimal('0'), help_text='Average cost after transaction')
    
    # Value details
    value_in = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0'), help_text='Value of stock received')
    value_out = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0'), help_text='Value of stock issued')
    balance_value = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0'), help_text='Running balance value')
    
    # GST details
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'))
    gst_amount_in = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0'))
    gst_amount_out = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0'))
    
    # Party information
    party = models.ForeignKey(Party, on_delete=models.SET_NULL, null=True, blank=True, related_name='stock_movements')
    
    # Reference to source document
    stock_invoice = models.ForeignKey(StockInvoice, on_delete=models.CASCADE, null=True, blank=True, related_name='movements')
    line_item = models.ForeignKey(StockInvoiceLineItem, on_delete=models.CASCADE, null=True, blank=True, related_name='movements')
    
    # System fields
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'stock_movements'
        verbose_name = 'Stock Movement'
        verbose_name_plural = 'Stock Movements'
        ordering = ['movement_date', 'created_at']
        indexes = [
            models.Index(fields=['company', 'product', 'movement_date']),
            models.Index(fields=['financial_year', 'movement_type']),
            models.Index(fields=['product', 'movement_date']),
        ]
    
    def __str__(self):
        return f"{self.product.code} - {self.movement_type} - {self.movement_date}"
    
    @classmethod
    def create_from_line_item(cls, line_item):
        """Create stock movement from invoice line item with average cost calculation"""
        invoice = line_item.stock_invoice
        product = line_item.product
        
        # Determine movement direction
        is_inward = invoice.invoice_type in ['purchase', 'import', 'sale_return']
        
        # Get previous balance
        last_movement = cls.objects.filter(
            company=invoice.company,
            product=product,
            movement_date__lte=invoice.invoice_date
        ).order_by('-movement_date', '-created_at').first()
        
        prev_balance_qty = last_movement.balance_quantity if last_movement else Decimal('0')
        prev_balance_value = last_movement.balance_value if last_movement else Decimal('0')
        prev_avg_cost = last_movement.average_cost if last_movement else Decimal('0')
        
        # Calculate new values
        if is_inward:
            quantity_in = line_item.quantity
            quantity_out = Decimal('0')
            value_in = line_item.amount_ex_gst
            value_out = Decimal('0')
            gst_amount_in = line_item.gst_value
            gst_amount_out = Decimal('0')
            unit_cost = line_item.unit_price
            
            # Calculate average cost (weighted average)
            new_balance_qty = prev_balance_qty + quantity_in
            new_balance_value = prev_balance_value + value_in
            
            if new_balance_qty > 0:
                average_cost = new_balance_value / new_balance_qty
            else:
                average_cost = unit_cost
        else:
            quantity_in = Decimal('0')
            quantity_out = line_item.quantity
            value_in = Decimal('0')
            # Use average cost for outward movements
            value_out = line_item.quantity * prev_avg_cost if prev_avg_cost > 0 else line_item.amount_ex_gst
            gst_amount_in = Decimal('0')
            gst_amount_out = line_item.gst_value
            unit_cost = prev_avg_cost if prev_avg_cost > 0 else line_item.unit_price
            
            new_balance_qty = prev_balance_qty - quantity_out
            new_balance_value = prev_balance_value - value_out
            average_cost = prev_avg_cost
        
        # Create movement record
        movement = cls.objects.create(
            company=invoice.company,
            financial_year=invoice.financial_year,
            product=product,
            movement_type=invoice.invoice_type,
            movement_date=invoice.invoice_date,
            reference_number=invoice.invoice_number,
            quantity_in=quantity_in,
            quantity_out=quantity_out,
            balance_quantity=new_balance_qty,
            unit_cost=unit_cost,
            average_cost=average_cost,
            value_in=value_in,
            value_out=value_out,
            balance_value=new_balance_value,
            gst_rate=line_item.gst_rate,
            gst_amount_in=gst_amount_in,
            gst_amount_out=gst_amount_out,
            party=invoice.party,
            stock_invoice=invoice,
            line_item=line_item,
            created_by=invoice.created_by
        )
        
        # Update subsequent movements if any
        cls._recalculate_subsequent_movements(product, invoice.invoice_date, movement.id)
        
        return movement
    
    @classmethod
    def _recalculate_subsequent_movements(cls, product, from_date, exclude_id=None):
        """Recalculate all subsequent movements after a change"""
        movements = cls.objects.filter(
            product=product,
            movement_date__gte=from_date
        ).order_by('movement_date', 'created_at')
        
        if exclude_id:
            movements = movements.exclude(id=exclude_id)
        
        running_qty = Decimal('0')
        running_value = Decimal('0')
        running_avg_cost = Decimal('0')
        
        # Get the last movement before the from_date
        prev_movement = cls.objects.filter(
            product=product,
            movement_date__lt=from_date
        ).order_by('-movement_date', '-created_at').first()
        
        if prev_movement:
            running_qty = prev_movement.balance_quantity
            running_value = prev_movement.balance_value
            running_avg_cost = prev_movement.average_cost
        
        for movement in movements:
            if movement.quantity_in > 0:  # Inward movement
                new_qty = running_qty + movement.quantity_in
                new_value = running_value + movement.value_in
                if new_qty > 0:
                    running_avg_cost = new_value / new_qty
                running_qty = new_qty
                running_value = new_value
            else:  # Outward movement
                movement.value_out = movement.quantity_out * running_avg_cost
                running_qty -= movement.quantity_out
                running_value -= movement.value_out
            
            movement.balance_quantity = running_qty
            movement.balance_value = running_value
            movement.average_cost = running_avg_cost
            movement.save(update_fields=['balance_quantity', 'balance_value', 'average_cost', 'value_out'])


class StockMovementReport:
    """Helper class for generating stock movement reports with grouping"""
    
    def __init__(self, company, financial_year=None):
        self.company = company
        self.financial_year = financial_year
    
    def get_movements(self, product=None, hs_code=None, category=None, 
                     date_from=None, date_to=None, movement_type=None):
        """Get stock movements with optional filters"""
        queryset = StockMovement.objects.filter(company=self.company)
        
        if self.financial_year:
            queryset = queryset.filter(financial_year=self.financial_year)
        
        if product:
            queryset = queryset.filter(product=product)
        
        if hs_code:
            queryset = queryset.filter(product__category__hs_code=hs_code)
        
        if category:
            queryset = queryset.filter(product__category=category)
        
        if date_from:
            queryset = queryset.filter(movement_date__gte=date_from)
        
        if date_to:
            queryset = queryset.filter(movement_date__lte=date_to)
        
        if movement_type:
            queryset = queryset.filter(movement_type=movement_type)
        
        return queryset.select_related(
            'product', 'product__category', 'product__category__hs_code', 
            'party', 'stock_invoice'
        ).order_by('movement_date', 'created_at')
    
    def get_grouped_report(self, group_by='product', **filters):
        """Generate grouped stock movement report"""
        movements = self.get_movements(**filters)
        
        if group_by == 'hs_code':
            return self._group_by_hs_code(movements)
        elif group_by == 'category':
            return self._group_by_category(movements)
        elif group_by == 'product':
            return self._group_by_product(movements)
        else:
            return list(movements)
    
    def _group_by_hs_code(self, movements):
        """Group movements by HS Code"""
        from collections import defaultdict
        grouped = defaultdict(list)
        
        for movement in movements:
            hs_code = movement.product.category.hs_code
            grouped[hs_code].append(movement)
        
        return dict(grouped)
    
    def _group_by_category(self, movements):
        """Group movements by Category"""
        from collections import defaultdict
        grouped = defaultdict(list)
        
        for movement in movements:
            category = movement.product.category
            grouped[category].append(movement)
        
        return dict(grouped)
    
    def _group_by_product(self, movements):
        """Group movements by Product"""
        from collections import defaultdict
        grouped = defaultdict(list)
        
        for movement in movements:
            product = movement.product
            grouped[product].append(movement)
        
        return dict(grouped)
    
    def get_summary_report(self, group_by='product', **filters):
        """Generate summary report with totals"""
        grouped_movements = self.get_grouped_report(group_by, **filters)
        summary = []
        
        for group_key, movements in grouped_movements.items():
            total_qty_in = sum(m.quantity_in for m in movements)
            total_qty_out = sum(m.quantity_out for m in movements)
            total_value_in = sum(m.value_in for m in movements)
            total_value_out = sum(m.value_out for m in movements)
            total_gst_in = sum(m.gst_amount_in for m in movements)
            total_gst_out = sum(m.gst_amount_out for m in movements)
            
            # Get final balance from last movement
            last_movement = movements[-1] if movements else None
            final_balance_qty = last_movement.balance_quantity if last_movement else 0
            final_balance_value = last_movement.balance_value if last_movement else 0
            final_avg_cost = last_movement.average_cost if last_movement else 0
            
            summary.append({
                'group': group_key,
                'group_name': str(group_key),
                'total_quantity_in': total_qty_in,
                'total_quantity_out': total_qty_out,
                'net_quantity': total_qty_in - total_qty_out,
                'total_value_in': total_value_in,
                'total_value_out': total_value_out,
                'net_value': total_value_in - total_value_out,
                'total_gst_in': total_gst_in,
                'total_gst_out': total_gst_out,
                'net_gst': total_gst_in - total_gst_out,
                'final_balance_quantity': final_balance_qty,
                'final_balance_value': final_balance_value,
                'final_average_cost': final_avg_cost,
                'movement_count': len(movements),
                'movements': movements
            })
        
        return summary