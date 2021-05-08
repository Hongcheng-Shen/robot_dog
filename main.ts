function doSomething () {
    data_1 = 舵狗_图像识别.识别小球返回值(舵狗_图像识别.Ball_Position.X轴)
    if (data_1 < 80) {
        data = (80 - data_1) / 10
        舵狗_底盘模式.舵狗_控制(舵狗_底盘模式.mode.左转, data, 1)
    } else if (data_1 > 80) {
        data = (data_1 - 80) / 10
        舵狗_底盘模式.舵狗_控制(舵狗_底盘模式.mode.右转, data, 1)
    }
}
function doSomething2 () {
    data_2 = 舵狗_图像识别.识别小球返回值(舵狗_图像识别.Ball_Position.像素点)
    if (data_2 < 1000) {
        舵狗_底盘模式.舵狗_控制(舵狗_底盘模式.mode.前进, 7, 1)
    } else if (data_2 > 1000) {
        舵狗_底盘模式.舵狗_控制(舵狗_底盘模式.mode.后退, 7, 1)
    }
}
let data_2 = 0
let data = 0
let data_1 = 0
serial.redirect(
SerialPin.P8,
SerialPin.P12,
BaudRate.BaudRate115200
)
舵狗_图像识别.图形识别初始化()
舵狗_底盘模式.舵狗_初始化()
舵狗_底盘模式.舵狗_高度(10)
舵狗_底盘模式.舵狗_启动()
舵狗_底盘模式.舵狗_步态(舵狗_底盘模式.gait.慢跑)
basic.forever(function () {
    舵狗_底盘模式.舵狗_心跳()
    if (舵狗_图像识别.识别小球(舵狗_图像识别.enColor.Red) == 1) {
        舵狗_底盘模式.舵狗_步态(舵狗_底盘模式.gait.慢跑)
        doSomething()
        doSomething2()
    } else {
        舵狗_底盘模式.舵狗_数据清除()
        舵狗_底盘模式.舵狗_原地站立()
    }
})
