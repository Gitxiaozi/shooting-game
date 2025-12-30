import cv2
import os
import sys

# === 配置区 ===
# 默认配置，可以通过命令行参数覆盖
DEFAULT_IMAGE_PATH = "group.jpg"
OUTPUT_DIR = "cropped_faces"
TARGET_SIZE = (50, 50)
# ==============

def extract_faces(image_path):
    """
    从图片中提取人脸并保存
    """
    # 创建输出目录
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 读取图像
    print(f"正在读取图片: {image_path}")
    image = cv2.imread(image_path)
    if image is None:
        print(f"❌ 错误：找不到图片 '{image_path}'，请检查文件名和路径！")
        return

    print("正在检测人脸...")

    # 转为灰度图（Haar级联需要）
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # 加载OpenCV自带的人脸检测器
    # 尝试多个可能的路径
    cascade_paths = [
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml',
        'haarcascade_frontalface_default.xml',
        os.path.join(os.path.dirname(cv2.__file__), 'data', 'haarcascade_frontalface_default.xml')
    ]
    
    face_cascade = None
    for path in cascade_paths:
        if os.path.exists(path):
            face_cascade = cv2.CascadeClassifier(path)
            # print(f"使用检测器: {path}")
            break
            
    if face_cascade is None:
        print("❌ 错误：找不到人脸检测器文件 (haarcascade_frontalface_default.xml)")
        return

    # 检测人脸
    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(30, 30)
    )

    print(f"✅ 检测到 {len(faces)} 张人脸")
    
    if len(faces) == 0:
        print("⚠️ 未检测到人脸，尝试使用更宽松的参数...")
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.05,
            minNeighbors=3,
            minSize=(20, 20)
        )
        print(f"✅ 重新检测到 {len(faces)} 张人脸")

    # 裁剪并保存
    saved_count = 0
    for i, (x, y, w, h) in enumerate(faces):
        # 稍微扩大一点裁剪范围，保留更多头部细节
        padding = int(w * 0.2)
        x_start = max(0, x - padding)
        y_start = max(0, y - padding)
        x_end = min(image.shape[1], x + w + padding)
        y_end = min(image.shape[0], y + h + padding)
        
        face = image[y_start:y_end, x_start:x_end]
        
        try:
            resized = cv2.resize(face, TARGET_SIZE, interpolation=cv2.INTER_AREA)
            output_path = os.path.join(OUTPUT_DIR, f"face_{i+1:02d}.jpg")
            cv2.imwrite(output_path, resized)
            print(f"  已保存: {output_path}")
            saved_count += 1
        except Exception as e:
            print(f"  ⚠️ 保存第 {i+1} 张人脸时出错: {e}")

    print(f"\n🎉 全部完成！共保存 {saved_count} 张 50x50 头像到 '{OUTPUT_DIR}' 文件夹。")
    print("💡 提示：刷新游戏页面即可看到新头像生效。")

if __name__ == "__main__":
    # 支持命令行参数输入图片路径
    if len(sys.argv) > 1:
        img_path = sys.argv[1]
    else:
        # 如果没有参数，尝试读取默认文件，或者询问用户
        if os.path.exists(DEFAULT_IMAGE_PATH):
            img_path = DEFAULT_IMAGE_PATH
        else:
            print(f"默认文件 '{DEFAULT_IMAGE_PATH}' 不存在。")
            img_path = input("请输入图片文件名或路径: ").strip().strip('"')
    
    if img_path:
        extract_faces(img_path)
