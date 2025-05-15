" AI Sports Edge .vimrc
" This file contains Vim configuration for the AI Sports Edge development environment.

" General settings
set nocompatible              " Use Vim settings, rather than Vi settings
set backspace=indent,eol,start " Allow backspacing over everything in insert mode
set history=1000             " Keep 1000 lines of command line history
set ruler                    " Show the cursor position all the time
set showcmd                  " Display incomplete commands
set incsearch                " Do incremental searching
set hlsearch                 " Highlight search results
set ignorecase               " Ignore case when searching
set smartcase                " Override ignorecase when search includes uppercase
set hidden                   " Allow buffer switching without saving
set autoread                 " Auto reload files changed outside vim
set laststatus=2             " Always show status line
set encoding=utf-8           " Use UTF-8 encoding
set fileencoding=utf-8       " Use UTF-8 file encoding
set scrolloff=3              " Keep 3 lines visible above/below cursor when scrolling
set sidescrolloff=5          " Keep 5 columns visible left/right of cursor when scrolling
set wildmenu                 " Better command-line completion
set wildmode=list:longest    " Complete files like a shell
set visualbell               " Use visual bell instead of beeping
set noerrorbells             " No error bells
set title                    " Show file title in terminal window
set ttyfast                  " Faster redrawing
set lazyredraw               " Don't redraw while executing macros
set showmatch                " Show matching brackets
set matchtime=2              " Show matching brackets for 0.2 seconds
set number                   " Show line numbers
set relativenumber           " Show relative line numbers
set cursorline               " Highlight current line
set nowrap                   " Don't wrap lines
set linebreak                " Break lines at word boundaries
set listchars=tab:▸\ ,trail:· " Show tabs and trailing spaces
set list                     " Show invisible characters

" Indentation settings
set autoindent               " Copy indent from current line when starting a new line
set smartindent              " Smart autoindenting when starting a new line
set expandtab                " Use spaces instead of tabs
set tabstop=2                " Number of spaces that a <Tab> counts for
set softtabstop=2            " Number of spaces that a <Tab> counts for while editing
set shiftwidth=2             " Number of spaces to use for each step of (auto)indent
set shiftround               " Round indent to multiple of 'shiftwidth'

" File type specific settings
filetype plugin indent on    " Enable file type detection and do language-dependent indenting
syntax enable                " Enable syntax highlighting

" Key mappings
let mapleader = ","          " Set leader key to comma

" Quickly edit/reload vimrc
nnoremap <leader>ev :e $MYVIMRC<CR>
nnoremap <leader>sv :source $MYVIMRC<CR>

" Quickly save file
nnoremap <leader>w :w<CR>

" Quickly quit
nnoremap <leader>q :q<CR>

" Quickly save and quit
nnoremap <leader>wq :wq<CR>

" Navigate between windows
nnoremap <C-h> <C-w>h
nnoremap <C-j> <C-w>j
nnoremap <C-k> <C-w>k
nnoremap <C-l> <C-w>l

" Navigate between buffers
nnoremap <leader>bn :bnext<CR>
nnoremap <leader>bp :bprevious<CR>
nnoremap <leader>bd :bdelete<CR>

" Clear search highlighting
nnoremap <leader>/ :nohlsearch<CR>

" Toggle line numbers
nnoremap <leader>n :set number!<CR>

" Toggle relative line numbers
nnoremap <leader>rn :set relativenumber!<CR>

" Toggle line wrapping
nnoremap <leader>wr :set wrap!<CR>

" Toggle paste mode
nnoremap <leader>p :set paste!<CR>

" Project-specific settings
" JavaScript/TypeScript settings
autocmd FileType javascript,typescript,javascriptreact,typescriptreact setlocal expandtab tabstop=2 softtabstop=2 shiftwidth=2

" React Native settings
autocmd BufNewFile,BufRead *.tsx,*.jsx set filetype=typescriptreact

" Markdown settings
autocmd FileType markdown setlocal wrap linebreak nolist textwidth=80 wrapmargin=0

" JSON settings
autocmd FileType json setlocal expandtab tabstop=2 softtabstop=2 shiftwidth=2

" YAML settings
autocmd FileType yaml setlocal expandtab tabstop=2 softtabstop=2 shiftwidth=2

" Bash settings
autocmd FileType sh setlocal expandtab tabstop=2 softtabstop=2 shiftwidth=2

" Automatically remove trailing whitespace on save
autocmd BufWritePre * :%s/\s\+$//e

" Return to last edit position when opening files
autocmd BufReadPost *
     \ if line("'\"") > 0 && line("'\"") <= line("$") |
     \   exe "normal! g`\"" |
     \ endif