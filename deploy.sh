#!/bin/bash
# DN Platform - GitHub Actions 배포 워크플로(Deploy (EC2))를 수동 실행한다.
# 커밋·push는 하지 않는다. 배포할 코드는 먼저 main에 올라가 있어야 한다.
# 필요: gh CLI 로그인 (gh auth status)

set -euo pipefail

REF="${1:-main}"

echo "=== DN Platform 배포: ${REF} ==="
gh workflow run deploy.yml --ref "$REF"
sleep 3
echo "진행 상황:"
gh run list --workflow deploy.yml --limit 1
echo "실시간 확인: gh run watch \$(gh run list --workflow deploy.yml --limit 1 --json databaseId --jq '.[0].databaseId')"
