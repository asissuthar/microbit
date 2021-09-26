import signal
import sys
import serial


def signalHandler(_signal, frame):
    sys.exit(0)


def receive():
    with serial.Serial("COM4", 115200) as _serial:
        while True:
            yield _serial.readline().decode().strip()


def main():
    signal.signal(signal.SIGINT, signalHandler)
    try:
        for data in receive():
            print(data)
    except Exception:
        pass


if __name__ == "__main__":
    main()
