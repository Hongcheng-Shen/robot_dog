let data = 0
serial.redirect(
SerialPin.P8,
SerialPin.P12,
BaudRate.BaudRate9600
)
moco_底盘模式.机器狗初始化()
moco_底盘模式.机器人狗高度(10)
moco_底盘模式.机器狗启动()
basic.forever(function () {
	
})
basic.forever(function () {
    moco_底盘模式.机器狗心跳()
    data = moco_语音识别.语音识别(moco_语音识别.voice_state.开启)
})
