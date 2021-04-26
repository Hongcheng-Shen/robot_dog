let data = 0
serial.redirect(
SerialPin.P8,
SerialPin.P12,
BaudRate.BaudRate115200
)
moco_图像识别.图形识别初始化()
moco_底盘模式.机器狗初始化()
moco_底盘模式.机器人狗高度(10)
moco_底盘模式.机器狗启动()
basic.forever(function () {
    moco_底盘模式.机器狗心跳()
    data = moco_图像识别.识别二维码号(5)
    if (data == 5) {
        moco_底盘模式.机器狗步态(moco_底盘模式.gait.慢跑)
    } else {
        moco_底盘模式.机器狗原地站立()
    }
})
