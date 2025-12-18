@echo off
del /f /q add_selected_option.sql 2>nul
del /f /q add-product-url-private.sql 2>nul
del /f /q fix-db-schema.sql 2>nul
del /f /q supabase_schema.sql 2>nul
del /f /q supabase_final.sql 2>nul
del /f /q supabase-schema-update.sql 2>nul
rmdir /s /q migrations 2>nul
echo SQL files and migrations folder deleted successfully!
