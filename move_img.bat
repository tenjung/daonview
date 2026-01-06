@echo off
copy "C:\Users\tenjung\.gemini\antigravity\brain\e5f5489e-276d-41d3-b035-d03dade5ec12\og_image_daonview_1767665641900.png" "c:\Users\tenjung\daonview\public\og-image.png" /Y
if exist "c:\Users\tenjung\daonview\public\og-image.png" (
    echo SUCCESS
) else (
    echo FAILED
)
