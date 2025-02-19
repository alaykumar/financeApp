from django.urls import path
from .views import category_pie_chart, category_monthly_spending

urlpatterns = [
    path('pie-chart/', category_pie_chart, name='pie-chart'),
    path('multi-line-chart/', category_monthly_spending, name='multi-line-chart'),
]