serial.redirect(
SerialPin.P8,
SerialPin.P12,
BaudRate.BaudRate115200
)
舵狗_图像识别.图形识别初始化()
舵狗_底盘模式.舵狗_初始化()
舵狗_底盘模式.舵狗_高度(10)
舵狗_底盘模式.舵狗_启动()
basic.forever(function () {
    舵狗_图像识别.巡线测试()
})
