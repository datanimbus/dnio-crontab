# dnio-crontab
This executable reads a config.json file and runs all the cronjob configured for a system where crontab is disabled.

## config.json
```
{
  "tasks": [
    {
      "name": "test",
      "cron": "* * * * *",
      "command": "echo 'Hello World'"
    }
  ]
}
```

## dnio-crontab.service
```
[Unit]
Description=dnio-crontab

[Service]
WorkingDirectory=${data.cwd}
User=${data.user}
Group=${data.group}
ExecStart=${data.cwd}/dnio-crontab -c ./config.json
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
```
