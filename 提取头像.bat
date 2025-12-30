@echo off
chcp 65001 >nul
echo ========================================
echo 从照片中提取人脸头像工具
echo ========================================
echo.

REM 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到Python，请先安装Python
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM 检查是否已安装依赖
python -c "import cv2" >nul 2>&1
if errorlevel 1 (
    echo 正在安装必要的库...
    pip install opencv-python Pillow
    if errorlevel 1 (
        echo 错误: 无法安装依赖库
        pause
        exit /b 1
    )
)

echo.
echo 请输入图片文件的完整路径（可以直接拖拽图片到此窗口）
echo 或者按回车键手动输入路径
echo.
set /p image_path="图片路径: "

if "%image_path%"=="" (
    echo 错误: 未输入图片路径
    pause
    exit /b 1
)

REM 移除路径两端的引号（如果有）
set image_path=%image_path:"=%

echo.
echo 正在处理图片...
echo.

python extract_faces.py "%image_path%"

echo.
echo ========================================
echo 处理完成！
echo ========================================
pause

