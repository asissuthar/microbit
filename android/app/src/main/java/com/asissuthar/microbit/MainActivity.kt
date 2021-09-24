package com.asissuthar.microbit

import android.os.Bundle
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import com.welie.blessed.BluetoothCentralManager
import com.welie.blessed.ConnectionFailedException
import com.welie.blessed.ScanMode
import com.welie.blessed.asString
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import java.util.*

class MainActivity : AppCompatActivity() {
    private val TAG: String = MainActivity::class.java.simpleName

    val uartServiceUuid = UUID.fromString("6e400001-b5a3-f393-e0a9-e50e24dcca9e")
    val uartRxCharUuid = UUID.fromString("6e400002-b5a3-f393-e0a9-e50e24dcca9e")
    val uartTxCharUuid = UUID.fromString("6e400003-b5a3-f393-e0a9-e50e24dcca9e")

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        val manager = BluetoothCentralManager(this)
        manager.setScanMode(ScanMode.LOW_POWER)

        manager.scanForPeripherals { peripheral, scanResult ->
            Log.i(TAG, "device ${peripheral.name}")
            if (peripheral.name.startsWith("BBC")) {
                manager.stopScan()
                scope.launch {
                    try {
                        peripheral.connect()
                        Log.i(TAG, "connected")

                        var characteristic = peripheral.getCharacteristic(uartServiceUuid, uartRxCharUuid)

                        while (characteristic == null) {
                            characteristic =
                                peripheral.getCharacteristic(uartServiceUuid, uartRxCharUuid)
                        }
                        peripheral.observe(characteristic) { value ->
                            Log.i(TAG, "value: ${value.asString()}")
                        }
                        characteristic.properties
                    } catch (connectionFailed: ConnectionFailedException) {
                        Log.i(TAG, "connectionFailed")
                    }
                }
            }
        }
    }

}