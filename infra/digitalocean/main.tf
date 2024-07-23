terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

// create ssh key
resource "tls_private_key" "ssh_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "digitalocean_ssh_key" "default" {
  name       = "Terraform Example"
  public_key = tls_private_key.ssh_key.public_key_openssh
}
# Write private key to file
resource "local_file" "private_key" {
  content         = tls_private_key.ssh_key.private_key_pem
  filename        = "${path.module}/id_rsa"
  file_permission = "0600"
}

# Write public key to file
resource "local_file" "public_key" {
  content         = tls_private_key.ssh_key.public_key_openssh
  filename        = "${path.module}/id_rsa.pub"
  file_permission = "0644"
}

resource "digitalocean_droplet" "web" {
  count    = length(var.regions)
  image    = "ubuntu-24-04-x64"
  name     = "hlf-${var.vm_names[count.index]}"
  region   = var.regions[count.index]
  size     = "s-1vcpu-1gb" # $6/month
  ssh_keys = [digitalocean_ssh_key.default.fingerprint]

}
resource "null_resource" "install_fabriclaunch" {
  count      = length(var.regions)
  depends_on = [digitalocean_droplet.web]
  provisioner "remote-exec" {
    inline = [
      "wget https://fabriclaunch.com/fabriclaunch && chmod +x fabriclaunch && mv fabriclaunch /usr/local/bin/fabriclaunch",
    ]
    connection {
      type        = "ssh"
      user        = "root"
      private_key = tls_private_key.ssh_key.private_key_pem
      host        = digitalocean_droplet.web[count.index].ipv4_address
    }
  }
  triggers = {
    always_run = "${timestamp()}"
  }
}

resource "null_resource" "install_go" {
  count      = length(var.regions)
  depends_on = [digitalocean_droplet.web]
  provisioner "remote-exec" {
    inline = [
      "wget https://go.dev/dl/go1.22.5.linux-amd64.tar.gz",
      "tar -C /usr/local -xzf go*.tar.gz",
      "echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc",
    ]
    connection {
      type        = "ssh"
      user        = "root"
      private_key = tls_private_key.ssh_key.private_key_pem
      host        = digitalocean_droplet.web[count.index].ipv4_address
    }
  }
}

# Null resource for remote-exec, one for each droplet
resource "null_resource" "fabric_setup" {
  count = length(var.regions)

  # Ensure this runs after the droplet is created
  depends_on = [digitalocean_droplet.web]

  # Use remote-exec provisioner to run the script
  provisioner "remote-exec" {
    inline = [
      "curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh && chmod +x install-fabric.sh",
      "./install-fabric.sh --fabric-version 2.5.9 binary",
      "sudo mv bin/configtxgen /usr/local/bin/configtxgen",
      "sudo mv bin/configtxlator /usr/local/bin/configtxlator",
      "sudo mv bin/cryptogen /usr/local/bin/cryptogen",
      "sudo mv bin/discover /usr/local/bin/discover",
      "sudo mv bin/fabric-ca-client /usr/local/bin/fabric-ca-client",
      "sudo mv bin/fabric-ca-server /usr/local/bin/fabric-ca-server",
      "sudo mv bin/ledgerutil /usr/local/bin/ledgerutil",
      "sudo mv bin/orderer /usr/local/bin/orderer",
      "sudo mv bin/osnadmin /usr/local/bin/osnadmin",
      "sudo mv bin/peer /usr/local/bin/peer",
      "sudo wget https://github.com/cloudflare/cfssl/releases/download/v1.6.5/cfssl_1.6.5_linux_amd64 -O /usr/local/bin/cfssl",
      "sudo wget https://github.com/cloudflare/cfssl/releases/download/v1.6.5/cfssljson_1.6.5_linux_amd64 -O /usr/local/bin/cfssljson",
      "sudo chmod +x /usr/local/bin/cfssl",
      "sudo chmod +x /usr/local/bin/cfssljson"
    ]
  }

  # Connection details for the remote-exec provisioner
  connection {
    type        = "ssh"
    user        = "root"
    private_key = tls_private_key.ssh_key.private_key_pem
    host        = digitalocean_droplet.web[count.index].ipv4_address
  }

  # Trigger recreation of this resource when the droplet changes
  triggers = {
    droplet_id = digitalocean_droplet.web[count.index].id
  }
}

output "droplet_ips" {
  value = {
    for droplet in digitalocean_droplet.web :
    droplet.name => droplet.ipv4_address
  }
}
