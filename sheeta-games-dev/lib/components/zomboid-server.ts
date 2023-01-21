import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export function generateUserData(serverName: string, region: string, vol: ec2.IVolume) {
  const userdata = ec2.UserData.forLinux();

  const targetDevice = '/dev/sdh';
  const mountName = '/dev/nvme1n1';

  userdata.addCommands(
    `echo "---- Install deps"`,
    `sudo add-apt-repository multiverse`,
    `sudo dpkg --add-architecture i386`,
    `sudo apt update`,
    `sudo apt install -y lib32gcc1 libsdl2-2.0-0:i386 docker.io awscli unzip`,
    `echo "---- done installing base commands"`,
  );

  userdata.addCommands(
    // Retrieve token for accessing EC2 instance metadata (https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instancedata-data-retrieval.html)
    `TOKEN=$(curl -SsfX PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")`,
    // Retrieve the instance Id of the current EC2 instance
    `INSTANCE_ID=$(curl -SsfH "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-id)`,
    // Attach the volume to /dev/xvdz
    `aws --region ${region} ec2 attach-volume --volume-id ${vol.volumeId} --instance-id $INSTANCE_ID --device ${targetDevice}`,
    // Wait until the volume has attached
    `while ! test -e ${mountName}; do sleep 1; done`
    // The volume will now be mounted. You may have to add additional code to format the volume if it has not been prepared.
  );

  userdata.addCommands(
    `mkfs -t xfs ${mountName}`,
    `mkdir /mnt/${serverName}`,
    `mount ${mountName} /mnt/${serverName}`,
    `echo "UUID=$(lsblk -o +UUID | grep ${serverName} | awk '{print $8}') /mnt/${serverName}  xfs  defaults,nofail  0  2" >> /etc/fstab`,
  );

  let installCommands: string[] = [
    `echo "---- Install PZ to /mnt/${serverName}"`,
    `mkdir /mnt/${serverName}`,
    `docker run -v /mnt/${serverName}:/data steamcmd/steamcmd:ubuntu-18 \
        +login anonymous \
        +force_install_dir /data \
        +app_update 380870 validate \
        +quit`
  ]

  userdata.addCommands(...installCommands);
  return userdata
}
