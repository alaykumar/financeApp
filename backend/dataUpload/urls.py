from django.urls import path
from .views import  get_statements, CSVUploadPreviewView, save_statements, CategoryView, UserCategoriesView, get_categories#, CSVUploadView

urlpatterns = [
    path('view-statement/', get_statements, name='view-statement'),
    path('categories/', get_categories, name='get-categories'),
    path('upload-csv-preview/', CSVUploadPreviewView.as_view(), name='upload-csv-preview'),
    path('save-statements/', save_statements, name='save-statements'),
    path('categories_list/', UserCategoriesView.as_view(), name='categories-list')
]