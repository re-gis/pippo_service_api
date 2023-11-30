#!/bin/bash

KUSTOMIZE_VERSION=v4.4.1
curl -fsSLo kustomize.tar.gz \
  "https://github.com/kubernetes-sigs/kustomize/releases/download/kustomize/${KUSTOMIZE_VERSION}/kustomize_${KUSTOMIZE_VERSION}_linux_amd64.tar.gz" \
  && tar -xf kustomize.tar.gz -C /usr/local/bin/ kustomize \
  && chmod +x /usr/local/bin/kustomize \
  && rm kustomize.tar.gz
# KUBECTL_VERSION=$(curl -L -s https://dl.k8s.io/release/stable.txt)
KUBECTL_VERSION=v1.22.3
curl -fsSLo /usr/local/bin/kubectl "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl" \
  && chmod +x /usr/local/bin/kubectl
