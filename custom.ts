//#########################全局###############################
//数据
let data_tx = pins.createBuffer(38);
let gait_mode = 0;
let rc_spd_cmd_X = 0.00 //x速度
let rc_spd_cmd_y = 0.00 //y速度
let rc_att_rate_cmd = 0.00 // 速度
let rc_spd_cmd_z = 0.00 //
let rc_pos_cmd = 0.00 //高度
let rc_att_cmd_x = 0.00 //俯仰
let rc_att_cmd_y = 0.00 //侧摆
let rc_att_cmd = 0.00 //航向角
let usb_send_cnt = 0
let state = 0

//SPI
let SSLen = 40
let InfoTemp = pins.createBuffer(SSLen)


//SPI初始化
function SPI_SPCP_Init() {
    pins.digitalWritePin(DigitalPin.P16, 1)
    pins.digitalWritePin(DigitalPin.P6, 1)
    pins.spiPins(DigitalPin.P15, DigitalPin.P14, DigitalPin.P13)
    pins.spiFrequency(1000000)
    led.enable(false)
}

//SPI底盘发送/接收
function Chassis_SPI_Send() {
    pins.digitalWritePin(DigitalPin.P16, 0)
    pins.digitalWritePin(DigitalPin.P6, 0)
    for (let i = 0; i < 200; i++);
    for (let i = 0; i < usb_send_cnt; i++) {
        InfoTemp[i] = pins.spiWrite(data_tx[i])
    }
    pins.digitalWritePin(DigitalPin.P6, 1)
    pins.digitalWritePin(DigitalPin.P16, 1)
}



//#########################SPI数据发送/接收###############################
//发送数据初始化
function Data_int() {
    for (let i = 0; i < 38; i++) {
        data_tx[i] = 0x00
    }
}

//数据发送
function Data_send() {
    let i = 0;
    let cnt_reg = 0;
    let sum = 0x00;
    usb_send_cnt = cnt_reg
    data_tx[usb_send_cnt++] = 0xCA
    data_tx[usb_send_cnt++] = 0xCF
    data_tx[usb_send_cnt++] = 0x93
    data_tx[usb_send_cnt++] = 0x21

    data_tx[usb_send_cnt++] = gait_mode
    get_float_hex(rc_spd_cmd_X)
    get_float_hex(rc_spd_cmd_y)
    get_float_hex(rc_att_rate_cmd)
    get_float_hex(rc_spd_cmd_z)
    get_float_hex(rc_pos_cmd)
    get_float_hex(rc_att_cmd_x)
    get_float_hex(rc_att_cmd_y)
    get_float_hex(rc_att_cmd)
    for (i = 0; i < usb_send_cnt; i++) {
        sum += data_tx[i]
    }
    data_tx[usb_send_cnt] = sum
    if (state == 1) {
        Chassis_SPI_Send()
    }
    // basic.pause(100)
}

//数据的解析
    //.................


//#########################数据转换###########################
function DecToBinTail(dec: number, pad: number) {
    let bin = "";
    let i;
    for (i = 0; i < pad; i++) {
        dec *= 2;
        if (dec >= 1) {
            dec -= 1;
            bin += "1";
        }
        else {
            bin += "0";
        }
    }
    return bin;
}

function DecToBinHead(dec: number, pad: number) {
    let bin = "";
    let i;
    for (i = 0; i < pad; i++) {
        bin = parseInt((dec % 2).toString()) + bin;
        dec /= 2;
    }
    return bin;
}

function get_float_hex(decString: number) {
    let dec = decString;
    let sign;
    let signString;
    let decValue = parseFloat(Math.abs(decString).toString());
    let fraction = 0;
    let exponent = 0;
    let ssss = []

    if (decString.toString().charAt(0) == '-') {
        sign = 1;
        signString = "1";
    }
    else {
        sign = 0;
        signString = "0";
    }
    if (decValue == 0) {
        fraction = 0;
        exponent = 0;
    }
    else {
        exponent = 127;
        if (decValue >= 2) {
            while (decValue >= 2) {
                exponent++;
                decValue /= 2;
            }
        }
        else if (decValue < 1) {
            while (decValue < 1) {
                exponent--;
                decValue *= 2;
                if (exponent == 0)
                    break;
            }
        }
        if (exponent != 0) decValue -= 1; else decValue /= 2;

    }
    let fractionString = DecToBinTail(decValue, 23);
    let exponentString = DecToBinHead(exponent, 8);
    let ss11 = parseInt(signString + exponentString + fractionString, 2)
    data_tx[usb_send_cnt++] = ((ss11 << 24) >> 24)
    data_tx[usb_send_cnt++] = ((ss11 << 16) >> 24)
    data_tx[usb_send_cnt++] = ((ss11 << 8) >> 24)
    data_tx[usb_send_cnt++] = ((ss11 >> 24))
}





//#########################底层功能选着模块#######################
//% color="#C814B8" weight=25 icon="\uf1d4"
namespace moco_底盘模式 {
    //运动模式选择
    export enum mode {
        //% block="前进"
        前进,
        //% block="后退"
        后退,
        //% block="左转"
        左转,
        //% block="右转"
        右转,
        //% block="左移"
        左移,
        //% block="右移"
        右移
    }
    //角度选择 
    export enum mode1 {
        //% block="左摆"
        左摆,
        //% block="右摆"
        右摆,
        //% block="俯视"
        俯视,
        //% block="仰视"
        仰视,
        //% block="航线角"
        航向角
    }
    //速度选择
    export enum speed {
        //% block="1"
        快,
        //% block="中"
        中,
        //% block="慢"
        慢,
        //% block="停"
        停
    }
    //步态选择
    export enum gait {
        //% block="慢跑"
        慢跑,
        //% block="快跑"
        快跑
    }

//机器狗反馈信息
//% block=MOCO.机器狗反馈信息 block="机器狗反馈信息"
//%weight=1
    export function 机器狗反馈信息(): number {
        return 0;
    }

//机器狗高度设置
//% block=MOCO.机器人狗高度 block="机器人狗|高度 %h"
//%weight=3
//% h.min=0.00 h.max=10.00
//% name.fieldEditor="gridpicker" name.fieldOptions.columns=10
    export function 机器人狗高度(h: number): void {
         rc_pos_cmd = h * 0.01
         Data_send();
    }

//机器狗启动/停止    
//% block=MOCO.机器狗启动 block="机器狗启动"
//%weight=2
    export function 机器狗启动(): void {
        // gait_mode = 4
        // rc_pos_cmd = 0.1
        // state = 1
        // basic.pause(3000)
        // for (let i = 0; i < 15; i++) {
        //     Data_send();
        //     basic.pause(100)
        // }
        // while (1) {
        //    Data_RX();
        //    if (robot_mode == 1)
        //         return
        //     Data_send();
        // }
    }

//机器狗步态选着
//% block=MOCO.机器狗步态 block="机器狗|步态 %g"
//%weight=5
//% name.fieldEditor="gridpicker" name.fieldOptions.columns=10
    export function 机器狗步态(g: gait): void {
        // switch (g) {
        //     case gait.慢跑:
        //         gait_mode = 1; break;
        //         while (1) {
        //             Data_RX()
        //             Data_send()
        //             if (robot_mode == 4)
        //                 return
        //         }
        // }
    }

//机器狗运动方向
//% block=MOCO.机器狗控制 block="机器狗控制|  模式 %m|速度 %speed1|时间 %time1"
//%weight=7
//% speed1.min=0.00 speed1.max=10.00
//% time1.min=0 time1.max=255
//% name.fieldEditor="gridpicker" name.fieldOptions.columns=10
    export function 机器狗控制(m: mode, speed1: number, time1: number): void {
        // let Sum_S = 0.00
        // Sum_S = speed1 / 100.00
        // switch (m) {
        //     case mode.前进:
        //         rc_spd_cmd_X = Sum_S; break;
        //     case mode.后退:
        //         rc_spd_cmd_X = (-Sum_S); break;
        //     case mode.左转:
        //         rc_att_rate_cmd = (speed1 * 5); break;
        //     case mode.右转:
        //         rc_att_rate_cmd = (-speed1 * 5); break;
        //     case mode.左移:
        //         rc_spd_cmd_y = Sum_S; break;
        //     case mode.右转:
        //         rc_spd_cmd_y = (-Sum_S); break;
        // }
        // for (let e = 0; e < time1; e++) {
        //     Data_RX()
        //     Data_send()
        //     basic.pause(100)
        // }
    }

//机器狗的运动角度选着
//% block=MOCO.机器狗控制角度 block="机器狗控制角度| %m|角度 %speed1|时间 %time1"
//%weight=7
//% speed1.min=0.00 speed1.max=10.00
//% time1.min=0 time1.max=255
//% name.fieldEditor="gridpicker" name.fieldOptions.columns=10
    export function 机器狗控制角度(m: mode1, speed1: number, time1: number): void {
        // switch (m) {
        //     case mode1.俯视:
        //         rc_att_cmd_x = speed1; break;
        //     case mode1.仰视:
        //         rc_att_cmd_x = speed1; break;
        //     case mode1.左摆:
        //         rc_att_cmd_y = speed1; break;
        //     case mode1.右摆:
        //         rc_att_cmd_y = speed1; break;
        //     case mode1.航向角:
        //         rc_att_cmd = speed1; break;
        // }
        // for (let e = 0; e < time1; e++) {
        //     Data_RX()
        //     Data_send()
        //     basic.pause(100)
        // }
    }


}


//#########################传感器功能#######################
//% color="#A810B8" weight=25 icon="\uf1E4"
namespace moco_传感器 {
//红外    
    export enum enObstacle {
        //%  block="障碍"
        Obstacle = 0,
        //%  block="无障碍"
        NoObstacle = 1
    }
//手势
    export enum Gesture_state {
        //% blockId="right" block="right"
        right = 1,
        //% blockId="left" block="left"  
        left = 2,
        //% blockId="up" block="up"        
        up = 4,
        //% blockId="down" block="down"        
        down = 8,
        //% blockId="forward" block="forward"        
        forward = 16,
        //% blockId="backward" block="backward"        
        backward = 32,
        //% blockId="clockwise" block="clockwise"        
        clockwise = 64,
        //% blockId="count_clockwise" block="count_clockwise"        
        count_clockwise = 128,
        //% blockId="wave" block="wave"        
        wave = 256
    }


//超声波
//% block=MOCO.超声波 block="超声波"
//%weight=1
    export function 超声波(): number {
        return 0;
    }

//七彩灯
//% block=MOCO.七彩灯 block="七彩灯"
//%weight=1
    export function 七彩灯(): number {
        return 0;
    }

//红外
//% block=MOCO.红外 block="红外|引脚 %pin|value %value "
//% weight=96
//% blockGap=20
//% color="#228B22"
//% name.fieldEditor="gridpicker" name.fieldOptions.columns=5
    export function IR(pin: DigitalPin, value: enObstacle): boolean {
        pins.setPull(pin, PinPullMode.PullUp);
        return pins.digitalReadPin(pin) == value;
    }

//手势    
    let Init_Register_Array = [
        [0xEF, 0x00],
        [0x37, 0x07],
        [0x38, 0x17],
        [0x39, 0x06],
        [0x41, 0x00],
        [0x42, 0x00],
        [0x46, 0x2D],
        [0x47, 0x0F],
        [0x48, 0x3C],
        [0x49, 0x00],
        [0x4A, 0x1E],
        [0x4C, 0x20],
        [0x51, 0x10],
        [0x5E, 0x10],
        [0x60, 0x27],
        [0x80, 0x42],
        [0x81, 0x44],
        [0x82, 0x04],
        [0x8B, 0x01],
        [0x90, 0x06],
        [0x95, 0x0A],
        [0x96, 0x0C],
        [0x97, 0x05],
        [0x9A, 0x14],
        [0x9C, 0x3F],
        [0xA5, 0x19],
        [0xCC, 0x19],
        [0xCD, 0x0B],
        [0xCE, 0x13],
        [0xCF, 0x64],
        [0xD0, 0x21],
        [0xEF, 0x01],
        [0x02, 0x0F],
        [0x03, 0x10],
        [0x04, 0x02],
        [0x25, 0x01],
        [0x27, 0x39],
        [0x28, 0x7F],
        [0x29, 0x08],
        [0x3E, 0xFF],
        [0x5E, 0x3D],
        [0x65, 0x96],
        [0x67, 0x97],
        [0x69, 0xCD],
        [0x6A, 0x01],
        [0x6D, 0x2C],
        [0x6E, 0x01],
        [0x72, 0x01],
        [0x73, 0x35],
        [0x74, 0x00],
        [0x77, 0x01]]

    let Init_PS_Array = [
        [0xEF, 0x00],
        [0x41, 0x00],
        [0x42, 0x00],
        [0x48, 0x3C],
        [0x49, 0x00],
        [0x51, 0x13],
        [0x83, 0x20],
        [0x84, 0x20],
        [0x85, 0x00],
        [0x86, 0x10],
        [0x87, 0x00],
        [0x88, 0x05],
        [0x89, 0x18],
        [0x8A, 0x10],
        [0x9f, 0xf8],
        [0x69, 0x96],
        [0x6A, 0x02],
        [0xEF, 0x01],
        [0x01, 0x1E],
        [0x02, 0x0F],
        [0x03, 0x10],
        [0x04, 0x02],
        [0x41, 0x50],
        [0x43, 0x34],
        [0x65, 0xCE],
        [0x66, 0x0B],
        [0x67, 0xCE],
        [0x68, 0x0B],
        [0x69, 0xE9],
        [0x6A, 0x05],
        [0x6B, 0x50],
        [0x6C, 0xC3],
        [0x6D, 0x50],
        [0x6E, 0xC3],
        [0x74, 0x05]]

    let Init_Gesture_Array = [
        [0xEF, 0x00],
        [0x41, 0x00],
        [0x42, 0x00],
        [0xEF, 0x00],
        [0x48, 0x3C],
        [0x49, 0x00],
        [0x51, 0x10],
        [0x83, 0x20],
        [0x9F, 0xF9],
        [0xEF, 0x01],
        [0x01, 0x1E],
        [0x02, 0x0F],
        [0x03, 0x10],
        [0x04, 0x02],
        [0x41, 0x40],
        [0x43, 0x30],
        [0x65, 0x96],
        [0x66, 0x00],
        [0x67, 0x97],
        [0x68, 0x01],
        [0x69, 0xCD],
        [0x6A, 0x01],
        [0x6B, 0xB0],
        [0x6C, 0x04],
        [0x6D, 0x2C],
        [0x6E, 0x01],
        [0x74, 0x00],
        [0xEF, 0x00],
        [0x41, 0xFF],
        [0x42, 0x01]]

    const PAJ7620_ID = 0x73                   //手势识别模块地址
    const PAJ7620_REGITER_BANK_SEL = 0xEF     //寄存器库选择

    const PAJ7620_BANK0 = 0
    const PAJ7620_BANK1 = 1

    const GES_RIGHT_FLAG = 1
    const GES_LEFT_FLAG = 2
    const GES_UP_FLAG = 4
    const GES_DOWN_FLAG = 8
    const GES_FORWARD_FLAG = 16
    const GES_BACKWARD_FLAG = 32
    const GES_CLOCKWISE_FLAG = 64
    const GES_COUNT_CLOCKWISE_FLAG = 128
    const GES_WAVE_FLAG = 1

    function GestureWriteReg(addr: number, cmd: number) {

        let buf = pins.createBuffer(2);
        buf[0] = addr;
        buf[1] = cmd;
        pins.i2cWriteBuffer(PAJ7620_ID, buf);
    }

    function GestureReadReg(addr: number): number {

        let buf = pins.createBuffer(1);
        buf[0] = addr;
        pins.i2cWriteBuffer(PAJ7620_ID, buf);

        let result = pins.i2cReadNumber(PAJ7620_ID, NumberFormat.UInt8LE, false);
        return result;
    }




    function GestureSelectBank(bank: number): void {
        switch (bank) {
            case 0:
                GestureWriteReg(PAJ7620_REGITER_BANK_SEL, PAJ7620_BANK0);
                break;
            case 1:
                GestureWriteReg(PAJ7620_REGITER_BANK_SEL, PAJ7620_BANK1);
                break;
            default:
                break;
        }

    }


    //% blockId="GestureInit" block="gesture init(success：0 failure：255)"
    export function GestureInit(): number {
        basic.pause(800);//等待芯片稳定

        /*GestureSelectBank(0);
        GestureSelectBank(0);
        if((GestureReadReg(0) != 0x20)||(GestureReadReg(1)!=0x76))
        {
            return 0xff;
            
        }*/
        if (GestureReadReg(0) != 0x20) {
            return 0xff;

        }


        for (let i = 0; i < Init_Register_Array.length; i++) {
            GestureWriteReg(Init_Register_Array[i][0], Init_Register_Array[i][1]);

        }
        GestureSelectBank(0);

        for (let i = 0; i < Init_Gesture_Array.length; i++) {
            GestureWriteReg(Init_Gesture_Array[i][0], Init_Gesture_Array[i][1]);

        }

        return 0;

    }

    //% blockId="GetGesture" block="get gesture"
    export function GetGesture(): number {

        let date = GestureReadReg(0x43);

        switch (date) {
            case GES_RIGHT_FLAG:
            case GES_LEFT_FLAG:
            case GES_UP_FLAG:
            case GES_DOWN_FLAG:
            case GES_FORWARD_FLAG:
            case GES_BACKWARD_FLAG:
            case GES_CLOCKWISE_FLAG:
            case GES_COUNT_CLOCKWISE_FLAG:
                break;

            default:
                date = GestureReadReg(0x44);
                if (date == GES_WAVE_FLAG) {
                    return 256;
                }
                break;

        }

        return date;
    }

    //% blockId="SelectGesture" block="select gesture is %state"
    //% color="#22cc22"
    export function SelectGesture(state: Gesture_state): number {

        return state;
    }

}