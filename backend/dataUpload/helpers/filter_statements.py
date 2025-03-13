from ..models import CSVData

def filter_statements(user, category=None, month=None):
    statements = CSVData.objects.filter(user=user)
    if category:
        statements = statements.filter(category=category)
    if month:
        statements = statements.filter(transactionDate__month=month)
    return statements.order_by("transactionDate")