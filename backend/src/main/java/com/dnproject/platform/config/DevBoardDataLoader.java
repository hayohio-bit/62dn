package com.dnproject.platform.config;

import com.dnproject.platform.domain.Board;
import com.dnproject.platform.domain.User;
import com.dnproject.platform.domain.constant.BoardType;
import com.dnproject.platform.repository.BoardRepository;
import com.dnproject.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 개발·데모용 게시판 예시 글. 실제 이용자가 쓴 글이 아니므로 운영(prod)에서는 실행하지 않는다.
 */
@Component
@Profile({ "local", "dev" })
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class DevBoardDataLoader implements ApplicationRunner {

        private final BoardRepository boardRepository;
        private final UserRepository userRepository;

        @Override
        @Transactional
        public void run(ApplicationArguments args) {
                // 운영 환경 안전을 위해 기존 데이터 삭제 로직 제거 및 데이터 존재 시 스킵
                if (boardRepository.count() > 0) {
                        return;
                }
                List<User> users = userRepository.findAll(PageRequest.of(0, 1)).getContent();
                if (users.isEmpty()) {
                        log.debug("게시판 더미 데이터: 회원이 없어 스킵");
                        return;
                }
                User author = users.get(0);

                // 1. 공지사항
                Board notice1 = createBoard(author, BoardType.NOTICE, "[안내] 62댕냥은 보호소 공고를 모아 보여 드려요",
                                "안녕하세요. 62댕냥입니다.\n\n62댕냥은 농림축산식품부 국가동물보호정보시스템에 올라온 유기동물 공고를 모아 보여 드립니다.\n입양·임시보호·봉사·기부 신청은 각 보호소에 전화로 해 주세요.",
                                528, true);

                // 2. FAQ
                Board faq1 = createBoard(author, BoardType.FAQ, "Q. 입양/봉사/기부 신청은 사이트 어디서 하나요?",
                                "A. 62댕냥은 현재 별도의 온라인 신청 폼을 제공하지 않습니다.\n\n저희 플랫폼은 전국의 유기동물과 보호소 정보를 보기 쉽게 모아 전달하는 역할을 하고 있습니다.",
                                1205,
                                false);
                Board faq2 = createBoard(author, BoardType.FAQ, "Q. 보호소에 필요한 후원 물품은 어떻게 알 수 있나요?",
                                "A. 보호소마다 현재 가장 시급하게 필요한 물품이 수시로 달라집니다.\n\n물품을 후원하고 싶으신 경우 전화를 걸어 어떤 물품이 필요한지 여쭤보시는 것을 권장합니다.",
                                892,
                                false);

                // 3. 봉사인증 (자유게시판으로 통합)
                Board vol1 = createBoard(author, BoardType.FREE, "이번 주말, 동대문구 보호소 산책 봉사 다녀왔습니다!",
                                "주말에 시간이 비어서 동대문구에 있는 보호소에 전화로 문의하고 산책 봉사를 다녀왔습니다.\n오늘 저랑 2시간 동안 공원을 누빈 '바둑이' 너무 행복했습니다!",
                                234, false);

                // 4. 기부인증 (자유게시판으로 통합)
                Board don1 = createBoard(author, BoardType.FREE, "겨울철 전기장판과 담요, 남양주 보호소에 보냈어요",
                                "날씨가 갑자기 쌀쌀해져서 남양주에 있는 보호소에 전화했더니 담요가 부족하다고 하시더라고요.\n깨끗한 수건 20장이랑 전기장판 3개 택배로 발송했습니다.",
                                189, false);

                // 5. 자유게시판 (FREE)
                Board free1 = createBoard(author, BoardType.FREE, "보호소 가기 전 꿀팁! 알아두면 좋은 것들",
                                "입양이든 봉사든 보호소 가실 때 알아두면 좋은 팁 공유합니다.\n1. 무작정 방문 금지! 2. 편한 옷 입기 3. 마스크 지참 4. 손등 냄새 맡게 해주기!",
                                412, false);
                Board free2 = createBoard(author, BoardType.FREE, "[입양후기] 62댕냥 보고 직접 연락해서 입양한 까망이",
                                "사이트에서 까망이 사진 보자마자 심쿵해서 바로 보호소에 전화 걸었어요.\n지금은 제 배 위에서 골골송 부르면서 잡니다 ㅠㅠ", 512, false);
                Board free3 = createBoard(author, BoardType.FREE, "중형견 처음 키우시는 분들을 위한 추천 하네스",
                                "보호소에서 15kg 나가는 진도 믹스 아이를 데려왔는데 가슴 압박이 적은 Y형 하네스로 바꿨어요!\n혹시 체구 좀 있는 아이 데려오시는 초보분들 하네스 적극 추천합니다.",
                                156,
                                false);

                boardRepository.saveAll(List.of(notice1, faq1, faq2, vol1, don1, free1, free2, free3));

                // 댓글 추가 연동 (필요 시 CommentRepository 추가 주입 가능하지만, 여기서는 핵심 데이터 위주로 게시글 먼저 완성)
                log.info("게시판 예시 글 8건 생성 (NOTICE, FAQ, FREE)");
        }

        private Board createBoard(User user, BoardType type, String title, String content, int views,
                        boolean isPinned) {
                return Board.builder()
                                .user(user)
                                .type(type)
                                .title(title)
                                .content(content)
                                .views(views)
                                .isPinned(isPinned)
                                .build();
        }
}
