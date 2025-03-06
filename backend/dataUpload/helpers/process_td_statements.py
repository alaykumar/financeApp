from datetime import datetime

from ..models import Category
from ..utils import categorize_transactions


def process_td_statement(csv_data, user):
    preview_data = []
    for transaction_date in range(csv_data.iloc[:, 0].size):
        d = datetime.strptime(csv_data.iloc[transaction_date, 0], '%m/%d/%Y')
        csv_data.iloc[transaction_date, 0] = d.strftime('%Y-%m-%d')

    for record in csv_data.to_dict(orient="records"):
        transaction_date = record[csv_data.columns[0]]
        vendor_name = record[csv_data.columns[1]]
        debit = record[csv_data.columns[2]]
        credit = record[csv_data.columns[3]]
        category = categorize_transactions(vendor_name, user)
        all_categories = Category.objects.values_list('name', flat=True)

        preview_data.append({
            "transactionDate": transaction_date,
            "vendorName": vendor_name,
            "debit": debit,
            "credit": credit,
            "suggestedCategory": category,
            "allCategories": list(all_categories),
        })
    return preview_data