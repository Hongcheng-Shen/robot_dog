function doSomething () {
    舵狗_底盘模式.舵狗_初始化()
    舵狗_底盘模式.舵狗_高度(10)
    舵狗_底盘模式.舵狗_启动()
    舵狗_底盘模式.舵狗_步态(舵狗_底盘模式.gait.小跑)
    for (let index = 0; index <= 30; index++) {
        舵狗_底盘模式.舵狗_控制(舵狗_底盘模式.mode.右移, index, 0)
    }
    for (let index = 0; index < 10; index++) {
        舵狗_底盘模式.舵狗_心跳()
        basic.pause(100)
    }
    舵狗_底盘模式.舵狗_原地站立()
}
function doSomething2 () {
    data = 舵狗_图像识别.巡线识别测试()
    if (data < 0) {
        舵狗_底盘模式.舵狗_控制角度(舵狗_底盘模式.mode1.右摆, 10, 0)
    } else if (data > 0) {
        舵狗_底盘模式.舵狗_控制角度(舵狗_底盘模式.mode1.左摆, 10, 0)
    } else {
        舵狗_底盘模式.舵狗_控制角度(舵狗_底盘模式.mode1.左摆, 0, 0)
    }
}
let data = 0
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
    doSomething2()
    舵狗_底盘模式.舵狗_心跳()
})
