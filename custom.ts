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
let robot_mode = 0
let state = 0

//SPI
let SSLen = 40
let InfoTemp = pins.createBuffer(SSLen)
let ToSlaveBuf = pins.createBuffer(SSLen)
let SfoCnt = 0
let DaHeader = 0x2B
let DaTail = 0xEE
let usb_send_cnt = 0


//SPI初始化
function SPI_SPCP_Init() {
    pins.digitalWritePin(DigitalPin.P16, 1)
    pins.digitalWritePin(DigitalPin.P6, 1)
    pins.spiPins(DigitalPin.P15, DigitalPin.P14, DigitalPin.P13)
    pins.spiFrequency(1000000)
    led.enable(false)
}

//#########################SPI数据发送/接收###############################
//spi发送、接收
    function SPI_Send() {
        if (state == 1){
            SPICom_Walk()
            pins.digitalWritePin(DigitalPin.P16, 0)
            pins.digitalWritePin(DigitalPin.P6, 0)
            for (let i = 0; i < 200; i++);
            for (let i = 0; i < SSLen; i++) {
                InfoTemp[i] = pins.spiWrite(ToSlaveBuf[i])
            }
            pins.digitalWritePin(DigitalPin.P6, 1)
            pins.digitalWritePin(DigitalPin.P16, 1)
           // serial.writeBuffer(InfoTemp)
             SPI_unpacking()
            basic.pause(20)
        }    
    }

    // function Initial_data(){


    // }   


function SPICom_Walk(){
    usb_send_cnt = 0
    let cnt_reg = 0
    let sum = 0
    ToSlaveBuf[usb_send_cnt++] = DaHeader; //头
    ToSlaveBuf[usb_send_cnt++] = SSLen - 2; //固定长度
    ToSlaveBuf[usb_send_cnt++] = 1;  //功能码

    ToSlaveBuf[usb_send_cnt++] = gait_mode;
    get_float_hex(rc_spd_cmd_X)
    get_float_hex(rc_spd_cmd_y)
    get_float_hex(rc_att_rate_cmd)
    get_float_hex(rc_spd_cmd_z)
    get_float_hex(rc_pos_cmd) //0.1
    get_float_hex(rc_att_cmd_x)
    get_float_hex(rc_att_cmd_y)
    get_float_hex(rc_att_cmd)

    ToSlaveBuf[SSLen - 1] = DaTail;
}


let cnt = 0
//数据的解析
    function SPI_unpacking(){
        cnt = 0
        if (InfoTemp[0] == 0x2B && InfoTemp[2] == 0x80)
            robot_mode = InfoTemp[3]
        //serial.writeNumber(robot_mode)
    }


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
    ToSlaveBuf[usb_send_cnt++] = ((ss11 << 24) >> 24)
    ToSlaveBuf[usb_send_cnt++] = ((ss11 << 16) >> 24)
    ToSlaveBuf[usb_send_cnt++] = ((ss11 << 8) >> 24)
    ToSlaveBuf[usb_send_cnt++] = ((ss11 >> 24))
}

//原地站立
function Standing(){
    if (robot_mode == 1)
        return
    gait_mode = 5
    while (1) {
        SPI_Send()
        // serial.writeNumber(9)
        // serial.writeNumber(robot_mode)
        if (robot_mode == 1) {
            gait_mode = 4
            SPI_Send()
            //serial.writeNumber(10)
            return;
        }
    }
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
//% block=MOCO.机器狗状态反馈信息 block="机器狗状态反馈信息"
//%weight=1
    export function 机器狗状态反馈信息(): number {
        return robot_mode;
    }

//机器狗初始化
//% block=MOCO.机器狗初始化 block="机器狗初始化"
//%weight=1
    export function 机器狗初始化(): void {
        SPI_SPCP_Init();
    }

//机器狗数据清除
//% block=MOCO.机器狗数据清除 block="机器狗数据清除"
//%weight=1
    export function 机器狗数据清除(): void {
        //SPI_SPCP_Init();
        //gait_mode = 0;
        rc_spd_cmd_X = 0.00 //x速度
        rc_spd_cmd_y = 0.00 //y速度
        rc_att_rate_cmd = 0.00 // 速度
        rc_spd_cmd_z = 0.00 //
        //rc_pos_cmd = 0.00 //高度
        rc_att_cmd_x = 0.00 //俯仰
        rc_att_cmd_y = 0.00 //侧摆
    }

//机器狗高度设置
//% block=MOCO.机器人狗高度 block="机器人狗|高度 %h"
//%weight=3
//% h.min=0.00 h.max=10.00
//% name.fieldEditor="gridpicker" name.fieldOptions.columns=10
    export function 机器人狗高度(h: number): void {
          rc_pos_cmd = h * 0.01
          SPI_Send()
    }

//机器狗启动/停止    
//% block=MOCO.机器狗启动 block="机器狗启动"
//%weight=2
    export function 机器狗启动(): void {
         gait_mode = 4
         state = 1
         basic.pause(3000)
        while(1){
            SPI_Send()
            if (robot_mode == 1){
                for(let i =0;i < 2;i++){
                    SPI_Send()
                    basic.pause(100)
                }
                return
            }
        }
    }

//机器狗原地站立
//% block=MOCO.机器狗原地站立 block="机器狗原地站立"
//%weight=2
    export function 机器狗原地站立(): void {
        Standing()
    } 

    //机器狗心跳
    //% block=MOCO.机器狗心跳 block="机器狗心跳"
    //%weight=2
    export function 机器狗心跳(): void {
        SPI_Send()
        //basic.pause(100)
    }

//机器狗启动/停止    
//% block=MOCO.机器狗停止 block="机器狗停止"
//%weight=2
    export function 机器狗停止(): void {
        if (robot_mode == 4){
            Standing()
            }
        if(robot_mode == 1){
            rc_pos_cmd = 0.01
        }
        SPI_Send()
        basic.pause(50)
        SPI_Send()
        state = 0
        

    }    

//机器狗步态选着
//% block=MOCO.机器狗步态 block="机器狗|步态 %g"
//%weight=5
//% name.fieldEditor="gridpicker" name.fieldOptions.columns=10
    export function 机器狗步态(g: gait): void {
        switch (g) {
            case gait.慢跑:
                gait_mode = 1; 
                while (1) {
                    SPI_Send()
                    if (robot_mode == 4){
                        SPI_Send()
                        //serial.writeNumber(2)
                        return
                    }
                }
        }
        SPI_Send()
    }

//机器狗运动方向
//% block=MOCO.机器狗控制 block="机器狗控制|  模式 %m|速度 %speed1|时间 %time1"
//%weight=7
//% speed1.min=0.00 speed1.max=10.00
//% time1.min=0 time1.max=255
//% name.fieldEditor="gridpicker" name.fieldOptions.columns=10
    export function 机器狗控制(m: mode, speed1: number, time1: number): void {
        let Sum_S = 0.00
        Sum_S = speed1 / 100.00
        SPI_Send()
        switch (m) {
            case mode.前进:
                rc_spd_cmd_X = Sum_S; SPI_Send(); break;
            case mode.后退:
                rc_spd_cmd_X = (-Sum_S); SPI_Send(); break;
            case mode.左转:
                rc_att_rate_cmd = (speed1 * 5); SPI_Send(); break;
            case mode.右转:
                rc_att_rate_cmd = (-speed1 * 5); SPI_Send(); break;
            case mode.左移:
                rc_spd_cmd_y = (-Sum_S); SPI_Send();  break;
            case mode.右移:
                rc_spd_cmd_y = Sum_S; SPI_Send();  break;
        }
        for (let e = 0; e < time1; e++) {
            SPI_Send()
            basic.pause(100)
        }
    }

//机器狗的运动角度选着
//% block=MOCO.机器狗控制角度 block="机器狗控制角度| %m|角度 %speed1|时间 %time1"
//%weight=7
//% speed1.min=0.00 speed1.max=10.00
//% time1.min=0 time1.max=255
//% name.fieldEditor="gridpicker" name.fieldOptions.columns=10
    export function 机器狗控制角度(m: mode1, speed1: number, time1: number): void {
        switch (m) {
            case mode1.俯视:
                rc_att_cmd_x = speed1; break;
            case mode1.仰视:
                rc_att_cmd_x = (-speed1); break;
            case mode1.左摆:
                rc_att_cmd_y = speed1; break;
            case mode1.右摆:
                rc_att_cmd_y = (-speed1); break;
            case mode1.航向角:
                rc_att_cmd = speed1; break;
        }
        for (let e = 0; e < time1; e++) {
            SPI_Send()
            basic.pause(100)
        }
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

//红外    
    export enum enObstacle1 {
        //%  block="有人"
        Obstacle = 500,
        //%  block="无人"
        NoObstacle = 0
    }

//手势
    export enum Gesture_state {
        //% block="从左到右"
        right = 1,
        //% block="从右到左"  
        left = 2,
        //% block="从下往上"        
        up = 4,
        //% block="从上往下"        
        down = 8,
        //% block="从后往前"        
        forward = 16,
        //% block="从前往后"        
        backward = 32,
        //% block="顺时针"        
        clockwise = 64,
        //% block="逆时针"        
        count_clockwise = 128,
        //% block="挥手"        
        wave = 256
    }
//七彩灯
    export enum enColor {

        //%  block="灭"
        OFF = 0,
        //%  block="红色"
        Red,
        //%  block="绿色"
        Green,
        //% block="蓝色"
        Blue,
        //%  block="白色"
        White,
        //%  block="青色"
        Cyan,
        //%  block="品红"
        Pinkish,
        //%  block="黄色"
        Yellow,

    }
//超声波
    export enum PingUnit {
        //% block="μs"
        MicroSeconds,
        //% block="cm"
        Centimeters,
        //% block="inches"
        Inches
    }

//超声波
//% blockId=MOCO.超声波 block="超声波 |发射管脚 %trig|接收管脚 %echo|unit %unit"
//% weight=96
//% blockGap=20
//% color="#228B22"
//% name.fieldEditor="gridpicker" name.fieldOptions.columns=5
    export function ping(trig: DigitalPin, echo: DigitalPin, unit: PingUnit, maxCmDistance = 500): number {
        // send pulse
        maxCmDistance = 500
        pins.setPull(trig, PinPullMode.PullNone);
        pins.digitalWritePin(trig, 0);
        control.waitMicros(2);
        pins.digitalWritePin(trig, 1);
        control.waitMicros(10);
        pins.digitalWritePin(trig, 0);

        // read pulse
        const d = pins.pulseIn(echo, PulseValue.High, maxCmDistance * 58);

        switch (unit) {
            case PingUnit.Centimeters: return Math.idiv(d, 58);
            case PingUnit.Inches: return Math.idiv(d, 148);
            default: return d;
        }
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

//红外
//% block=MOCO.人体感应 block="人体感应|引脚 %pin|value %value "
//% weight=96
//% blockGap=20
//% color="#228B22"
//% name.fieldEditor="gridpicker" name.fieldOptions.columns=5
    export function 人体(pin: AnalogPin, value: enObstacle1): number {
        let w = pins.analogReadPin(pin)
        if (w >= value)
            return 1
        // if(w)    
            return 0   

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


    //% block=MOCO.手势 block="初始化手势识别（成功：0 失败：255）"
    //% color="#3CB371"
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

    //% block=MOCO.手势 block="获取手势识别结果值"
    //% color="#3CB371"
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

    //% block=MOCO.手势 block="选择手势为| %state "
    //% color="#3CB371"
    export function 选择手势为(state: Gesture_state): number {

        return state;
    }


//七彩灯
    //% block=MOCO.RGB block="RGB七彩灯|引脚R %pin1|引脚G %pin2|引脚B %pin3|显示 %value"
    //% weight=1
    //% blockGap=8
    //% color="#C814B8"
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function RGB2(pin1: DigitalPin, pin2: DigitalPin, pin3: DigitalPin, value: enColor): void {

        switch (value) {
            case enColor.OFF: {
                pins.digitalWritePin(pin1, 0);
                pins.digitalWritePin(pin2, 0);
                pins.digitalWritePin(pin3, 0);
                break;
            }
            case enColor.Red: {
                pins.digitalWritePin(pin1, 1);
                pins.digitalWritePin(pin2, 0);
                pins.digitalWritePin(pin3, 0);
                break;
            }
            case enColor.Green: {
                pins.digitalWritePin(pin1, 0);
                pins.digitalWritePin(pin2, 1);
                pins.digitalWritePin(pin3, 0);
                break;
            }
            case enColor.Blue: {
                pins.digitalWritePin(pin1, 0);
                pins.digitalWritePin(pin2, 0);
                pins.digitalWritePin(pin3, 1);
                break;
            }
            case enColor.White: {
                pins.digitalWritePin(pin1, 1);
                pins.digitalWritePin(pin2, 1);
                pins.digitalWritePin(pin3, 1);
                break;
            }
            case enColor.Cyan: {
                pins.digitalWritePin(pin1, 0);
                pins.digitalWritePin(pin2, 1);
                pins.digitalWritePin(pin3, 1);
                break;
            }
            case enColor.Pinkish: {
                pins.digitalWritePin(pin1, 1);
                pins.digitalWritePin(pin2, 0);
                pins.digitalWritePin(pin3, 1);
                break;
            }
            case enColor.Yellow: {
                pins.digitalWritePin(pin1, 1);
                pins.digitalWritePin(pin2, 1);
                pins.digitalWritePin(pin3, 0);
                break;
            }
        }

    }

}

//#########################舵机控制#######################
//% color="#03AA74" weight=25 icon="\uf021" blockGap=8
namespace moco_舵机控制{
    let ToSlaveBuf_1 = pins.createBuffer(SSLen)
    let InfoTemp_1 = pins.createBuffer(SSLen)
    let usb_send_cnt_1 = 0
    let SfoCnt_1 = 0
    let DaHeader_1 = 0x2B
    let DaTail_1 = 0xEE
 
    function SG_SPI_Send() {
        pins.digitalWritePin(DigitalPin.P16, 0)
        pins.digitalWritePin(DigitalPin.P6, 0)
        for (let i = 0; i < 200; i++);
        for (let i = 0; i < SSLen; i++) {
            InfoTemp_1[i] = pins.spiWrite(ToSlaveBuf_1[i])
        }
        serial.writeBuffer(ToSlaveBuf_1)
        pins.digitalWritePin(DigitalPin.P6, 1)
        pins.digitalWritePin(DigitalPin.P16, 1)
        basic.pause(200)
    }

    //% block=MOCO.舵机控制 block="舵机| 号 %h|PWM值 %pwm|变化（快慢） %Gap|"
    //% weight=1
    //% blockGap=8
    //% color="#C814B8"
    //% h.min=0 h.max=3
    //% pwm.min=500 pwm.max=2500
    //% Gap.min=0 Gap.max=9
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=10
    export function 舵机(h: number, pwm: number,Gap: number){
        usb_send_cnt_1 = 0;

        ToSlaveBuf_1[usb_send_cnt_1++] = DaHeader_1; //头
        ToSlaveBuf_1[usb_send_cnt_1++] = SSLen - 2; //固定长度
        ToSlaveBuf_1[usb_send_cnt_1++] = 2;  //功能码

        ToSlaveBuf_1[usb_send_cnt_1++] = h;
        ToSlaveBuf_1[usb_send_cnt_1++] = pwm >> 8;
        ToSlaveBuf_1[usb_send_cnt_1++] = (pwm << 8) >> 8;
        ToSlaveBuf_1[usb_send_cnt_1++] = Gap;

        ToSlaveBuf_1[SSLen - 1] = DaTail_1;//固定长度

        SG_SPI_Send()
    }
}

//#########################图像识别#######################
//% color="#03AA74" weight=25 icon="\uf021" blockGap=8
namespace moco_图像识别 {
    //------------定义--------------
    let Identify_TX = pins.createBuffer(10)
    let Identify_RX = pins.createBuffer(50)
    let cnt_p = 0
    //二维码
    let Identify_x = 0x00, Identify_y = 0x00, Identify_z = 0x00
    let Identify_Flip_x = 0x00, Identify_Flip_y = 0x00, Identify_Flip_z = 0x00
    let Identify_status = 0x00, Identify_pattern = 0x00
    //小球
    let Ball_status = 0x00  //状态
    let Ball_X = 0x00, Ball_Y = 0x00 //x轴、y轴
    let Ball_W = 0x00, Ball_H = 0x00 //宽、高
    let Ball_pixels = 0x00  //像素点数量

    let CRC_L =0x00
    let CRC_H =0x00

    let CRC_tx_L = 0x00
    let CRC_tx_H = 0x00

    let Function_s = 0      //功能选着（1：二维码 2：小球）
    let Function_c = 0x00   //功能码 


    //------------TX--------------
    //数据发送
    function Identify_send() {
        cnt_p = 0
        Identify_TX[cnt_p++] = 0x01 // ID
        Identify_TX[cnt_p++] = 0x03
        Identify_TX[cnt_p++] = 0x00
        Identify_TX[cnt_p++] = Function_c
        Identify_TX[cnt_p++] = 0x00
        Identify_TX[cnt_p++] = 0x08
        usMBCRC16(Identify_TX, cnt_p)
        // serial.writeBuffer(Identify_TX)
        Identify_TX[cnt_p++] = CRC_tx_H
        Identify_TX[cnt_p++] = CRC_tx_L
        serial.writeBuffer(Identify_TX)
        basic.pause(100)
       
    }
    //------------RX--------------
    //数据接收
    function Identify_receive() {
        //serial.setRxBufferSize(32)
        let position_r = 0
        let sum_r =0x00
        let length_r = 0
        //let CRC_L = 0x00
        Identify_RX = serial.readBuffer(0)
        //serial.writeBuffer(Identify_RX)
        //basic.showNumber(Identify_RX[1])
        if (Identify_RX[0] == 0x01 && Identify_RX[1] < 0xFF){ 
            //basic.showNumber(1)
            length_r = Identify_RX[2]
            //serial.writeNumber(length_r)
            usMBCRC16(Identify_RX, length_r +3)
            if (Identify_RX[length_r + 3] == CRC_H && Identify_RX[length_r + 4] == CRC_L){
                if (Function_s = 1)
                    Identify_collection(Identify_RX)
                if (Function_s = 2)
                    Ball_rd(Identify_RX)
            }
         }
        
        return
    }

    //二维码数据获取
    function Identify_collection(Identify_RX_1:any){
        //serial.writeBuffer(Identify_RX_1)
        let Identify_RX_2 = pins.createBuffer(50)
        Identify_RX_2 = Identify_RX_1
        let cnt_I =3
        Identify_status = Data_conversion(Identify_RX_2[cnt_I++], Identify_RX_2[cnt_I++])   //
        // serial.writeNumber(Identify_status)
        Identify_pattern = Data_conversion(Identify_RX_2[cnt_I++], Identify_RX_2[cnt_I++])  //
        Identify_x = Data_conversion(Identify_RX_2[cnt_I++], Identify_RX_2[cnt_I++])        //
        Identify_y = Data_conversion(Identify_RX_2[cnt_I++], Identify_RX_2[cnt_I++])        //
        Identify_z = Data_conversion(Identify_RX_2[cnt_I++], Identify_RX_2[cnt_I++])        //
        Identify_Flip_x = Data_conversion(Identify_RX_2[cnt_I++], Identify_RX_2[cnt_I++])   //
        Identify_Flip_y = Data_conversion(Identify_RX_2[cnt_I++], Identify_RX_2[cnt_I++])   //
        Identify_Flip_z = Data_conversion(Identify_RX_2[cnt_I++], Identify_RX_2[cnt_I++])   //
        //serial.writeNumber(Identify_x)
        //basic.showNumber(Identify_pattern)
    }

    //小球识别
    function Ball_rd(Identify_RX_1: any){
        let Identify_RX_2 = pins.createBuffer(50)
        Identify_RX_2 = Identify_RX_1
        let cnt_I = 3
        //serial.writeBuffer(Identify_RX_2)
        Ball_status = Data_conversion(Identify_RX_2[cnt_I++], Identify_RX_2[cnt_I++])
        Ball_X = Data_conversion(Identify_RX_2[cnt_I++], Identify_RX_2[cnt_I++])
        Ball_Y = Data_conversion(Identify_RX_2[cnt_I++], Identify_RX_2[cnt_I++])
        Ball_W = Data_conversion(Identify_RX_2[cnt_I++], Identify_RX_2[cnt_I++])
        Ball_H = Data_conversion(Identify_RX_2[cnt_I++], Identify_RX_2[cnt_I++])
        Ball_pixels = Data_conversion(Identify_RX_2[cnt_I++], Identify_RX_2[cnt_I++])
        //serial.writeNumber(Ball_X)
    }

    let aucCRCHi = [0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41,
        0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40,
        0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41,
        0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41,
        0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41,
        0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40,
        0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40,
        0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40,
        0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41,
        0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40,
        0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41,
        0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41,
        0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41,
        0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41,
        0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41,
        0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41,
        0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41,
        0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40,
        0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41,
        0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41,
        0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41,
        0x00, 0xC1, 0x81, 0x40]
    let aucCRCLo = [0x00, 0xC0, 0xC1, 0x01, 0xC3, 0x03, 0x02, 0xC2, 0xC6, 0x06, 0x07, 0xC7,
        0x05, 0xC5, 0xC4, 0x04, 0xCC, 0x0C, 0x0D, 0xCD, 0x0F, 0xCF, 0xCE, 0x0E,
        0x0A, 0xCA, 0xCB, 0x0B, 0xC9, 0x09, 0x08, 0xC8, 0xD8, 0x18, 0x19, 0xD9,
        0x1B, 0xDB, 0xDA, 0x1A, 0x1E, 0xDE, 0xDF, 0x1F, 0xDD, 0x1D, 0x1C, 0xDC,
        0x14, 0xD4, 0xD5, 0x15, 0xD7, 0x17, 0x16, 0xD6, 0xD2, 0x12, 0x13, 0xD3,
        0x11, 0xD1, 0xD0, 0x10, 0xF0, 0x30, 0x31, 0xF1, 0x33, 0xF3, 0xF2, 0x32,
        0x36, 0xF6, 0xF7, 0x37, 0xF5, 0x35, 0x34, 0xF4, 0x3C, 0xFC, 0xFD, 0x3D,
        0xFF, 0x3F, 0x3E, 0xFE, 0xFA, 0x3A, 0x3B, 0xFB, 0x39, 0xF9, 0xF8, 0x38,
        0x28, 0xE8, 0xE9, 0x29, 0xEB, 0x2B, 0x2A, 0xEA, 0xEE, 0x2E, 0x2F, 0xEF,
        0x2D, 0xED, 0xEC, 0x2C, 0xE4, 0x24, 0x25, 0xE5, 0x27, 0xE7, 0xE6, 0x26,
        0x22, 0xE2, 0xE3, 0x23, 0xE1, 0x21, 0x20, 0xE0, 0xA0, 0x60, 0x61, 0xA1,
        0x63, 0xA3, 0xA2, 0x62, 0x66, 0xA6, 0xA7, 0x67, 0xA5, 0x65, 0x64, 0xA4,
        0x6C, 0xAC, 0xAD, 0x6D, 0xAF, 0x6F, 0x6E, 0xAE, 0xAA, 0x6A, 0x6B, 0xAB,
        0x69, 0xA9, 0xA8, 0x68, 0x78, 0xB8, 0xB9, 0x79, 0xBB, 0x7B, 0x7A, 0xBA,
        0xBE, 0x7E, 0x7F, 0xBF, 0x7D, 0xBD, 0xBC, 0x7C, 0xB4, 0x74, 0x75, 0xB5,
        0x77, 0xB7, 0xB6, 0x76, 0x72, 0xB2, 0xB3, 0x73, 0xB1, 0x71, 0x70, 0xB0,
        0x50, 0x90, 0x91, 0x51, 0x93, 0x53, 0x52, 0x92, 0x96, 0x56, 0x57, 0x97,
        0x55, 0x95, 0x94, 0x54, 0x9C, 0x5C, 0x5D, 0x9D, 0x5F, 0x9F, 0x9E, 0x5E,
        0x5A, 0x9A, 0x9B, 0x5B, 0x99, 0x59, 0x58, 0x98, 0x88, 0x48, 0x49, 0x89,
        0x4B, 0x8B, 0x8A, 0x4A, 0x4E, 0x8E, 0x8F, 0x4F, 0x8D, 0x4D, 0x4C, 0x8C,
        0x44, 0x84, 0x85, 0x45, 0x87, 0x47, 0x46, 0x86, 0x82, 0x42, 0x43, 0x83,
        0x41, 0x81, 0x80, 0x40]

//CRC校验
    function usMBCRC16(pucFrame: any, usLen: number){
        // serial.writeNumber(usLen)
        // serial.writeBuffer(pucFrame)
        let Data_1 = pins.createBuffer(8)
        let Data_2 = pins.createBuffer(2)
        let Data_3
        let usLen_1 = usLen
        Data_1 = pucFrame
        let ucCRCHi = 0xFF
        let ucCRCLo = 0xFF
        let iIndex, i = 0
        while (usLen--) {
            iIndex = (ucCRCLo ^ Data_1[i++])
            ucCRCLo = (ucCRCHi ^ aucCRCHi[iIndex])
            ucCRCHi = aucCRCLo[iIndex]
        }
        Data_3 = ucCRCHi << 8 | ucCRCLo
         CRC_L = Data_3 >> 8
         CRC_H = Data_3 & 0x00ff
         CRC_tx_L = Data_3 >> 8
         CRC_tx_H = Data_3 & 0x00ff
        
    }
//CRC数据转化
    function Data_conversion(data1:number,data2:number): number{
        let data3
        let data4 = 0xFFFF
        if(data1>0x7F){
            data3 = ((data1 << 8 | data2)-1)^data4
            return -data3
        }
        else{
            data3 = (data1 << 8 )| data2
            return data3
        }
        
    }

    //位置值
    export enum Position_value {
        //% block="X轴"
        X轴,
        //% block="Y轴"
        Y轴,
        //% block="Z轴"
        Z轴,
        //% block="X轴翻转"
        X轴翻转,
        //% block="Y轴翻转"
        Y轴翻转,
        //% block="Z轴翻转"
        Z轴翻转,
    }

    //小球位置
    export enum Ball_Position{
        //% block="X轴"
        X轴,
        //% block="Y轴"
        Y轴,
        //% block="宽度值"
        宽度值,
        //% block="高度值"
        高度值,
        //% block="像素点"
        像素点
    }


    export enum enColor {
        //%  block="红色"
        Red,
        //%  block="绿色"
        Green,
        //% block="蓝色"
        Blue,
        //%  block="白色"
        White,
        //%  block="青色"
        Cyan,
        //%  block="品红"
        Pinkish,
        //%  block="黄色"
        Yellow,
    }

    //% block=MOCO.识别二维码 block="识别二维码 | %A"
    //%weight=3
    //% A.min=1 A.max=6
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=10
    export function 识别二维码号(A: number): number {
        Function_c = 0x04
        Function_s = 1
        Identify_send()
        Identify_receive()
        if (A == Identify_pattern)
            return Identify_pattern
        return 0    
    }

    //% block=MOCO.识别小球 block="识别小球 | %Color"
    //%weight=3
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=10
    export function 识别小球(Color: enColor):number{
        Function_c = 0x24
        Function_s = 2
        Identify_send()
        Identify_receive()
        return Ball_status
    }

    //% block=MOCO.识别小球返回值 block="识别小球返回值 | %Color"
    //%weight=3
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=10
    export function 识别小球返回值(Position_B: Ball_Position):number{
        Function_c = 0x24
        Function_s = 2
        Identify_send()
        Identify_receive()
        switch(Position_B){
            case Ball_Position.X轴 : return Ball_X; break;
            case Ball_Position.Y轴 : return Ball_Y; break;
            case Ball_Position.宽度值 : return Ball_W; break;
            case Ball_Position.高度值: return Ball_H; break;
            case Ball_Position.像素点: return Ball_pixels; break;
            default: return 255
        }
    }



    //% block=MOCO.图形识别初始化 block="图形识别初始化"
    //%weight=3
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=10
    export function 图形识别初始化(){
        serial.setRxBufferSize(32)
    }

    //% block=MOCO.二维码位置返回值 block="二维码位置返回值 | %A"
    //%weight=3
    //% A.min=0 A.max=6
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=10
    export function 二维码位置返回值(data: Position_value): number {
        Identify_send()
        Identify_receive()
        switch(data){
            case Position_value.X轴: return  Identify_x;break;
            case Position_value.Y轴: return Identify_x; break;
            case Position_value.Z轴: return Identify_x; break;
            case Position_value.X轴翻转: return Identify_x; break;
            case Position_value.Y轴翻转: return Identify_x; break;
            case Position_value.Z轴翻转: return Identify_x; break;
            default : return 255
        }
    }


    //% block=MOCO.测试 block="测试"
    //%weight=3
    //% h.min=0.00 h.max=10.00
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=10
    export function 测试() {
        Identify_send()
        Identify_receive()
 
    }

}


//#########################语音识别#######################
//% color="#03AA74" weight=25 icon="\uf021" blockGap=8

namespace moco_语音识别 {

    let get_data = 0x00 //获取数据
    let voice_speed = 7 //速度

    function speech_recognition_rx() {
        let rx_data = pins.createBuffer(4) //创建数组
        //get_data = 0x00
        rx_data = serial.readBuffer(0) //读取RX缓存中数据
        //serial.writeBuffer(rx_data)
        //basic.showNumber(rx_data[2])
        if (rx_data[0] == 0xF4 && rx_data[1] == 0x06 && rx_data[3] == 0xff) {
            get_data = rx_data[2]
            //serial.writeNumber(get_data)
            //basic.showNumber(get_data)
        }
    }

//初始化
    function speech_recognition_init() {
        moco_底盘模式.机器狗初始化()
        moco_底盘模式.机器人狗高度(10)
        moco_底盘模式.机器狗启动()
    }

//语音数据
    function voice_data() {
        switch(get_data){
            case 0x002: moco_底盘模式.机器狗数据清除()
                        moco_底盘模式.机器狗原地站立()
                        //moco_底盘模式.机器狗步态(moco_底盘模式.gait.慢跑);
                        break

            case 0x003: moco_底盘模式.机器狗数据清除()
                        moco_底盘模式.机器狗步态(moco_底盘模式.gait.慢跑)
                        moco_底盘模式.机器狗控制(moco_底盘模式.mode.前进, voice_speed, 1);break

            case 0x004: moco_底盘模式.机器狗数据清除()
                        moco_底盘模式.机器狗步态(moco_底盘模式.gait.慢跑)
                        moco_底盘模式.机器狗控制(moco_底盘模式.mode.后退, voice_speed, 1);break

            case 0x005: moco_底盘模式.机器狗数据清除()
                        moco_底盘模式.机器狗步态(moco_底盘模式.gait.慢跑)
                        moco_底盘模式.机器狗控制(moco_底盘模式.mode.左移, voice_speed, 1);break

            case 0x006: moco_底盘模式.机器狗数据清除()
                        moco_底盘模式.机器狗步态(moco_底盘模式.gait.慢跑)
                        moco_底盘模式.机器狗控制(moco_底盘模式.mode.右移, voice_speed, 1);break

            case 0x007: moco_底盘模式.机器狗数据清除()
                        moco_底盘模式.机器狗步态(moco_底盘模式.gait.慢跑)
                        moco_底盘模式.机器狗控制(moco_底盘模式.mode.左转, voice_speed, 1);break

            case 0x008: moco_底盘模式.机器狗数据清除()
                        moco_底盘模式.机器狗步态(moco_底盘模式.gait.慢跑)
                        moco_底盘模式.机器狗控制(moco_底盘模式.mode.右转, voice_speed, 1);break

            case 0x009: moco_底盘模式.机器狗数据清除()
                        moco_底盘模式.机器狗步态(moco_底盘模式.gait.慢跑)
                        moco_底盘模式.机器狗控制(moco_底盘模式.mode.前进, voice_speed, 1)
                        moco_底盘模式.机器狗控制(moco_底盘模式.mode.左移, voice_speed, 1);break

            case 0x00A: moco_底盘模式.机器狗数据清除()
                        moco_底盘模式.机器狗步态(moco_底盘模式.gait.慢跑)
                        moco_底盘模式.机器狗控制(moco_底盘模式.mode.前进, voice_speed, 1)
                        moco_底盘模式.机器狗控制(moco_底盘模式.mode.右移, voice_speed, 1);break

            case 0x00B: moco_底盘模式.机器狗数据清除()
                        moco_底盘模式.机器狗步态(moco_底盘模式.gait.慢跑)
                        moco_底盘模式.机器狗控制(moco_底盘模式.mode.后退, voice_speed, 1)
                        moco_底盘模式.机器狗控制(moco_底盘模式.mode.左移, voice_speed, 1);break

            case 0x00C: moco_底盘模式.机器狗数据清除()
                        moco_底盘模式.机器狗步态(moco_底盘模式.gait.慢跑)
                        moco_底盘模式.机器狗控制(moco_底盘模式.mode.后退, voice_speed, 1)
                        moco_底盘模式.机器狗控制(moco_底盘模式.mode.右移, voice_speed, 1);break

            case 0x00D: moco_底盘模式.机器狗数据清除()
                        moco_底盘模式.机器狗原地站立
                        moco_底盘模式.机器狗控制角度(moco_底盘模式.mode1.俯视, 10, 1);break

            case 0x00E: moco_底盘模式.机器狗数据清除()
                        moco_底盘模式.机器狗原地站立
                        moco_底盘模式.机器狗控制角度(moco_底盘模式.mode1.仰视, 10, 1);break

            case 0x00F: moco_底盘模式.机器狗数据清除()
                        moco_底盘模式.机器狗原地站立
                        moco_底盘模式.机器狗控制角度(moco_底盘模式.mode1.左摆, 10, 1); break

            case 0x010: moco_底盘模式.机器狗数据清除()
                        moco_底盘模式.机器狗原地站立
                        moco_底盘模式.机器狗控制角度(moco_底盘模式.mode1.右摆, 10, 1);break
            //立正
            case 0x11:  moco_底盘模式.机器狗数据清除()
                        moco_底盘模式.机器狗原地站立();break   

            case 0x12:  moco_底盘模式.机器狗数据清除()
                        moco_底盘模式.机器狗原地站立()
                        moco_底盘模式.机器人狗高度(5);break

            case 0x13:  moco_底盘模式.机器狗数据清除()
                        moco_底盘模式.机器狗原地站立()
                        moco_底盘模式.机器人狗高度(0);break
//快速踏步
            case 0x14:  moco_底盘模式.机器狗数据清除()
                        moco_底盘模式.机器狗步态(moco_底盘模式.gait.慢跑);break
//慢速踏步
            case 0x15: moco_底盘模式.机器狗数据清除()
                        moco_底盘模式.机器狗步态(moco_底盘模式.gait.慢跑);break
//加速
            case 0x16: moco_底盘模式.机器狗数据清除()
                       voice_speed = 10;break
//减速
            case 0x17: moco_底盘模式.机器狗数据清除()
                        voice_speed = 7;break
//握手
            case 0x18: moco_底盘模式.机器狗数据清除()
                       moco_底盘模式.机器狗原地站立(); break
//俯卧撑
            case 0x19:  moco_底盘模式.机器狗数据清除()
                        moco_底盘模式.机器狗原地站立(); break
            default : return            
        }
    }

    export enum voice_state{
        //%  block="开启"
        开启,
        //%  block="关闭"
        关闭,
        //%  block="自定义"
        自定义

    }

    //% block=MOCO.语音识别 block=" 语音识别 | %state"
    //%weight=3
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=10
    export function 语音识别(state :voice_state):number {
        switch(state){
            case voice_state.关闭 :  return 0 ;break
            case voice_state.自定义 : return get_data ;break
        }
        speech_recognition_rx()
        voice_data()
        return 1

    }

    //% block=MOCO.测试 block="测试"
    //%weight=3
    //% h.min=0.00 h.max=10.00
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=10
    export function 测试():number {
        speech_recognition_rx();
        //basic.showNumber(1)
        return get_data
    }
}